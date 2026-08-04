// https://www.backblaze.com/apidocs/b2-list-file-names

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { B2_API_VERSION_PATH } = require('../backblaze/backblaze.constants');
const {
  bucketIdentifierValidator,
  resolveBucketIdFromIdentifier,
} = require('../backblaze/backblaze.utils');
const { backblazeGet, backblazeGetter } = require('../backblaze/backblazeGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['bucketIdentifier', bucketIdentifierValidator],
]);

const backblazeFilesGet = async (
  returnGetter,

  credsPayload,
  bucketIdentifier,
  {
    prefix,
    maxFileCount,
    fetchClient,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    bucketIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const bucketIdResponse = await resolveBucketIdFromIdentifier(
    credsPayload,
    bucketIdentifier,
    { fetchClient },
  );
  if (!bucketIdResponse.ok) {
    return bucketIdResponse;
  }

  const { data: bucketId } = bucketIdResponse;

  const getterArgs = [
    credsPayload,
    `${ B2_API_VERSION_PATH }/b2_list_file_names`,
    {
      params: {
        bucketId,
        ...prefix && { prefix },
      },
      ...maxFileCount && { maxFileCount },
      ...fetchClient && { fetchClient },
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
    "bucketIdentifier": { "bucketName": "crabs" }
  }'
*/
