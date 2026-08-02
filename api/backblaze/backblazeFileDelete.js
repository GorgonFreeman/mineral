// https://www.backblaze.com/apidocs/b2-delete-file-version

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { B2_API_VERSION_PATH } = require('../backblaze/backblaze.constants');
const { backblazeClient } = require('../backblaze/backblaze.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fileName'],
  ['fileId'],
]);

const backblazeFileDelete = async (
  credsPayload,
  fileName,
  fileId,
  {
    fetchClient = backblazeClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fileName,
    fileId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `${ B2_API_VERSION_PATH }/b2_delete_file_version`,
      body: {
        fileName,
        fileId,
      },
    },
    context: { credsPayload },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  backblazeFileDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/backblazeFileDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "backblaze" },
    "fileName": "hello.txt",
    "fileId": "REPLACE_FILE_ID"
  }'
*/
