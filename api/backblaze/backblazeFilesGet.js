// https://www.backblaze.com/apidocs/b2-list-file-names

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { B2_API_VERSION_PATH } = require('../backblaze/backblaze.constants');
const { backblazeGet, backblazeGetter } = require('../backblaze/backblazeGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['bucketId'],
]);

const backblazeFilesGet = async (
  returnGetter,

  credsPayload,
  bucketId,
  {
    prefix,
    maxFileCount,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    bucketId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    `${ B2_API_VERSION_PATH }/b2_list_file_names`,
    {
      params: {
        bucketId,
        ...prefix && { prefix },
      },
      ...maxFileCount && { maxFileCount },
      ...getterOptions,
    },
  ];

  return returnGetter
    ? backblazeGetter(...getterArgs)
    : backblazeGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  backblazeFilesGet: (...args) => backblazeFilesGet(false, ...args),
  backblazeFilesGetter: (...args) => backblazeFilesGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/backblazeFilesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "backblaze" },
    "bucketId": "REPLACE_BUCKET_ID"
  }'
*/
