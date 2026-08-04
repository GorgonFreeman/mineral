// https://www.backblaze.com/apidocs/b2-list-buckets

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { B2_API_VERSION_PATH } = require('../backblaze/backblaze.constants');
const { backblazeClient, getBackblazeSession } = require('../backblaze/backblaze.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const backblazeBucketsGet = async (
  credsPayload,
  {
    bucketName,
    fetchClient = backblazeClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const sessionResponse = await getBackblazeSession(credsPayload);

  if (!sessionResponse.ok) {
    return sessionResponse;
  }

  const { data: session } = sessionResponse;
  const { accountId } = session;

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `${ B2_API_VERSION_PATH }/b2_list_buckets`,
      body: {
        accountId,
        ...bucketName && { bucketName },
      },
    },
    context: {
      credsPayload,
      session,
      resultPath: 'buckets',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  backblazeBucketsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/backblazeBucketsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "backblaze" }
  }'
*/
