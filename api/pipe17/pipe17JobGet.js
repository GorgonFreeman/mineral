// https://apidoc.pipe17.com/#/operations/fetchJob

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17GetSingle } = require('../pipe17/pipe17.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['jobId'],
]);

const pipe17JobGet = async (
  credsPayload,
  jobId,
  {
    inspect = false,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    jobId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return pipe17GetSingle(
    credsPayload,
    '/jobs',
    jobId,
    {
      resultPath: 'result.job',
      inspect,
      fetchClient,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17JobGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17JobGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "jobId": "eb7586ac111d3afb"
  }'
*/
