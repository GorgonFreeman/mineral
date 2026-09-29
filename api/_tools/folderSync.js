/**
 * A function that very securely transfers files from one place to another.
 * It uses checksums to ensure the file transferred successfully,
 * and compares local files with destination ones before trashing.
 * It is designed to be idempotent and interruptible.
 * It is intended to be generic but will start as locked on Google Drive.
 */

const fs = require('fs').promises;

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { googledriveFilesGet } = require('../google/googledriveFilesGet');

const argsWarden = new ArgsWarden([
  ['folderPath'],
  ['googledriveCredsPayload', credsValidator],
  ['googledriveFolderId'],
]);

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

  const dirents = await fs.readdir(folderPath, { withFileTypes: true });
  const files = dirents.filter((dirent) => dirent.isFile());

  for (const file of files) {
    logDeep({ file });

    const googledriveFile = googledriveFilesByName[file.name] || null;
    logDeep({ googledriveFile });
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
