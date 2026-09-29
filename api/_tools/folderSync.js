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

const { ArgsWarden, askQuestion, logDeep } = require('../utils');
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
    googledriveFilesByName[googledriveFile.name] = googledriveFile;
  }

  logDeep({ googledriveFilesByName });

  const dirents = await fsPromises.readdir(folderPath, { withFileTypes: true });
  const files = dirents.filter((dirent) => dirent.isFile());

  for (const file of files) {
    logDeep({ file });

    const filePath = `${ folderPath }/${ file.name }`;
    const googledriveFile = googledriveFilesByName[file.name] || null;
    logDeep({ googledriveFile });

    // Compare the checksums
    if (googledriveFile) {
      const localMd5 = await fileMd5(filePath);
      const googledriveMd5 = googledriveFile.md5Checksum || null;
      const checksumsMatch = Boolean(
        localMd5
        && googledriveMd5
        && localMd5 === googledriveMd5,
      );
      logDeep({ localMd5, googledriveMd5, checksumsMatch });

      if (checksumsMatch) {
        // Trash local by moving it to the Bin (MacOS)
        await trashLocalFile(filePath);
        console.log('trashed local file', filePath);
        continue;
      }
      
      // Checksums differ — delete destination file
      const googledriveFileDeleteResponse = await googledriveFileDelete(
        googledriveCredsPayload,
        googledriveFile.id,
      );
      if (!googledriveFileDeleteResponse.ok) {
        return googledriveFileDeleteResponse;
      }

      delete googledriveFilesByName[file.name];
      console.log('deleted googledrive file', googledriveFile.id, file.name);

      await askQuestion('?');
    }

    // Upload file
    const googledriveFileUploadResponse = await googledriveFileUpload(
      googledriveCredsPayload,
      { filePath },
      { folderId: googledriveFolderId },
    );
    if (!googledriveFileUploadResponse.ok) {
      return googledriveFileUploadResponse;
    }

    const uploadedGoogledriveFile = googledriveFileUploadResponse.data;
    logDeep({ uploadedGoogledriveFile });

    // When done, check checksums again
    const localMd5 = await fileMd5(filePath);
    const uploadedMd5 = uploadedGoogledriveFile.md5Checksum || null;
    const checksumsMatch = Boolean(
      localMd5
      && uploadedMd5
      && localMd5 === uploadedMd5,
    );
    logDeep({ localMd5, uploadedMd5, checksumsMatch });

    if (checksumsMatch) {
      await trashLocalFile(filePath);
      console.log('trashed local file after upload', filePath);
    } else {
      return {
        ok: false,
        error: {
          code: 'UPLOAD_CHECKSUM_MISMATCH',
          message: `Uploaded checksum mismatch for ${ file.name }`,
          details: {
            localMd5,
            uploadedMd5,
            uploadedFileId: uploadedGoogledriveFile.id,
          },
        },
      };
    }
  }

  return { 
    ok: true, 
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
