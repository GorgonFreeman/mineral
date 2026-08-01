const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleDrive, googleApiCall } = require('../google/google.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const googledriveFilesGet = async (
  credsPayload,
  {
    folderIdentifier = {},
    pageSize = 100,
    pageToken,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { folderId } = folderIdentifier;

  if (!folderId) {
    return {
      ok: false,
      error: {
        code: 'MISSING_FOLDER_ID',
        message: 'folderIdentifier.folderId is required',
      },
    };
  }

  const { client, error } = await getGoogleDrive(credsPayload);

  if (error) {
    return error;
  }

  return googleApiCall(() => client.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: [
      'trashed=false',
      `'${ folderId }' in parents`,
    ].join(' and '),
    pageSize,
    ...pageToken && { pageToken },
    fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
  }));
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googledriveFilesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googledriveFilesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "options": { "folderIdentifier": { "folderId": "REPLACE_FOLDER_ID" } }
  }'
*/
