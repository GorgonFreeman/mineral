const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleDrive, googleApiCall } = require('../google/google.utils');

const defaultAttrs = 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink';

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fileId'],
]);

const googledriveFileGet = async (
  credsPayload,
  fileId,
  {
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fileId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { client, error } = await getGoogleDrive(credsPayload);

  if (error) {
    return error;
  }

  return googleApiCall(() => client.files.get({
    supportsAllDrives: true,
    fileId,
    fields: attrs,
  }));
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googledriveFileGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googledriveFileGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "fileId": "1YWzBt28D9ikWpreifWwo-2xdOQ4FATcA"
  }'
*/
