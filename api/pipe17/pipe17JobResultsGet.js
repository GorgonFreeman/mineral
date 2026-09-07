// https://apidoc.pipe17.com/#/operations/fetchJobResults

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['jobId'],
]);

const pipe17JobResultsGet = async (
  credsPayload,
  jobId,
  {
    inspect = false,
    fetchClient = pipe17Client,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    jobId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/jobs/${ jobId }/results`,
    },
    context: { credsPayload },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17JobResultsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17JobResultsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "jobId": "a25261fefd836d00"
  }'
*/
