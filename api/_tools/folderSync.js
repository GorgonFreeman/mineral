/**
 * A function that very securely transfers files from one place to another.
 * It uses checksums to ensure the file transferred successfully,
 * and compares local files with destination ones before trashing.
 * It is designed to be idempotent and interruptible.
 * It is intended to be generic but will start as locked on Google Drive.
 */

const crypto = require('crypto');
const fs = require('fs');
const fsPromises = fs.promises;
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const {
  ArgsWarden,
  askQuestion,
  logDeep,
  Processor,
} = require('../utils');
const { credsValidator } = require('../validators');
const { googledriveFilesGet } = require('../google/googledriveFilesGet');
const { googledriveFileDelete } = require('../google/googledriveFileDelete');
const { googledriveFileUpload } = require('../google/googledriveFileUpload');

const argsWarden = new ArgsWarden([
  ['folderPath'],
  ['googledriveCredsPayload', credsValidator],
  ['googledriveFolderId'],
]);

const fileMd5 = (filePath) => {
  console.log(`making checksum of ${ filePath }`);
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    stream.on('error', reject);
  });
};

const trashLocalFile = async (filePath) => {
  await execFileAsync('osascript', [
    '-e', 'on run argv',
    '-e', 'set theFile to POSIX file (item 1 of argv)',
    '-e', 'tell application "Finder" to delete theFile',
    '-e', 'end run',
    filePath,
  ]);
  console.log('trashed local file', filePath);
};

const compareChecksums = async (filePath, remoteMd5) => {
  const localMd5 = await fileMd5(filePath);
  const checksumsMatch = Boolean(
    localMd5
    && remoteMd5
    && localMd5 === remoteMd5,
  );
  logDeep({ localMd5, remoteMd5, checksumsMatch });
  return {
    localMd5,
    remoteMd5,
    checksumsMatch,
  };
};

const folderSync = async (
  folderPath,
  googledriveCredsPayload,
  googledriveFolderId,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    folderPath,
    googledriveCredsPayload,
    googledriveFolderId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  /**
   * 1. For each file in the local folder,
   * Check if a file with the same name exists in the destination.
   * 3. If it does, compare the checksums.
   *   a. If the checksums are the same, trash local, by moving it to the the Bin (MacOS) - this leaves it restorable.
   *   b. If the checksums are different, delete destination file.
   * 4. If the file does not exist in the destination, or the checksums were different, upload it.
   * 5. Once the file is uploaded, compare the checksums. If they match, trash the local file.
   */

  const googledriveFilesGetResponse = await googledriveFilesGet(
    googledriveCredsPayload,
    { folderId: googledriveFolderId },
  );
  if (!googledriveFilesGetResponse.ok) {
    return googledriveFilesGetResponse;
  }

  const googledriveFilesByName = {};
  for (const googledriveFile of googledriveFilesGetResponse.data) {
    if (googledriveFilesByName[googledriveFile.name]) {
      return {
        ok: false,
        error: {
          code: 'DUPLICATE_DRIVE_NAMES',
          message: `Drive folder has multiple files named ${ googledriveFile.name }`,
          details: {
            name: googledriveFile.name,
            ids: [
              googledriveFilesByName[googledriveFile.name].id,
              googledriveFile.id,
            ],
          },
        },
      };
    }
    googledriveFilesByName[googledriveFile.name] = googledriveFile;
  }

  logDeep({ googledriveFilesByName });

  const dirents = await fsPromises.readdir(folderPath, { withFileTypes: true });
  const files = dirents.filter((dirent) => dirent.isFile());

  const uploadPile = [];
  const skipped = [];
  const trashedExisting = [];

  const uploadProcessor = new Processor(
    uploadPile,
    async (pile) => {
      const {
        filePath,
        fileName,
      } = pile.shift();

      const googledriveFileUploadResponse = await googledriveFileUpload(
        googledriveCredsPayload,
        { filePath },
        { folderId: googledriveFolderId },
      );
      if (!googledriveFileUploadResponse.ok) {
        return {
          ok: false,
          fileName,
          error: googledriveFileUploadResponse.error,
        };
      }

      const uploadedGoogledriveFile = googledriveFileUploadResponse.data;
      logDeep({ uploadedGoogledriveFile });

      const uploadedMd5 = uploadedGoogledriveFile.md5Checksum || null;
      if (!uploadedMd5) {
        console.log(
          'no md5Checksum after upload, skipping trash',
          fileName,
          uploadedGoogledriveFile.id,
        );
        return {
          ok: false,
          fileName,
          error: {
            code: 'UPLOAD_MISSING_CHECKSUM',
            message: `Uploaded file missing md5Checksum for ${ fileName }`,
            details: {
              uploadedFileId: uploadedGoogledriveFile.id,
            },
          },
        };
      }

      const {
        localMd5,
        checksumsMatch,
      } = await compareChecksums(filePath, uploadedMd5);

      if (!checksumsMatch) {
        return {
          ok: false,
          fileName,
          error: {
            code: 'UPLOAD_CHECKSUM_MISMATCH',
            message: `Uploaded checksum mismatch for ${ fileName }`,
            details: {
              localMd5,
              uploadedMd5,
              uploadedFileId: uploadedGoogledriveFile.id,
            },
          },
        };
      }

      await trashLocalFile(filePath);
      return {
        ok: true,
        fileName,
        trashed: true,
        uploadedFileId: uploadedGoogledriveFile.id,
      };
    },
    {
      canFinish: false,
      logFlavourText: 'folderSyncUpload',
    },
  );

  const uploadRunPromise = uploadProcessor.run();

  for (const file of files) {
    logDeep({ file });

    const filePath = `${ folderPath }/${ file.name }`;
    const googledriveFile = googledriveFilesByName[file.name] || null;
    logDeep({ googledriveFile });

    if (googledriveFile) {
      const googledriveMd5 = googledriveFile.md5Checksum || null;
      if (!googledriveMd5) {
        console.log('no md5Checksum, skipping', file.name, googledriveFile.id);
        skipped.push({
          fileName: file.name,
          reason: 'MISSING_REMOTE_CHECKSUM',
          googledriveFileId: googledriveFile.id,
        });
        continue;
      }

      const { checksumsMatch } = await compareChecksums(filePath, googledriveMd5);

      if (checksumsMatch) {
        await trashLocalFile(filePath);
        trashedExisting.push(file.name);
        continue;
      }

      const googledriveFileDeleteResponse = await googledriveFileDelete(
        googledriveCredsPayload,
        googledriveFile.id,
      );
      if (!googledriveFileDeleteResponse.ok) {
        uploadProcessor.canFinish = true;
        await uploadRunPromise;
        return googledriveFileDeleteResponse;
      }

      delete googledriveFilesByName[file.name];
      console.log('deleted googledrive file', googledriveFile.id, file.name);

      await askQuestion('?');
    }

    uploadPile.push({
      filePath,
      fileName: file.name,
    });
  }

  uploadProcessor.canFinish = true;
  const uploadResults = await uploadRunPromise;

  const uploadFailures = uploadResults.filter((result) => result && !result.ok);
  const trashedUploads = uploadResults.filter((result) => result?.ok && result?.trashed);

  const allFilesHandled = (
    skipped.length === 0
    && uploadFailures.length === 0
    && (trashedExisting.length + trashedUploads.length) === files.length
  );

  if (!allFilesHandled) {
    return {
      ok: false,
      error: {
        code: 'FOLDER_SYNC_INCOMPLETE',
        message: 'Not all files were uploaded and trashed',
        details: {
          fileCount: files.length,
          trashedExistingCount: trashedExisting.length,
          trashedUploadCount: trashedUploads.length,
          skipped,
          uploadFailures,
        },
      },
    };
  }

  return {
    ok: true,
    data: {
      fileCount: files.length,
      trashedExistingCount: trashedExisting.length,
      trashedUploadCount: trashedUploads.length,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  folderSync,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/folderSync" \
  -H "Content-Type: application/json" \
  -d '{
    "folderPath": "/cool_stuff/freezing_cold",
    "googledriveCredsPayload": { "credsPath": "google" },
    "googledriveFolderId": "123XYZ"
  }'
*/
