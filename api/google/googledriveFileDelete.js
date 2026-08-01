const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleDrive, googleApiCall } = require('../google/google.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fileId'],
]);

const googledriveFileDelete = async (
  credsPayload,
  fileId,
  {
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

  return googleApiCall(() => client.files.delete({
    supportsAllDrives: true,
    fileId,
  }));
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googledriveFileDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googledriveFileDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "fileId": "REPLACE_FILE_ID"
  }'
*/
