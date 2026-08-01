// https://apidoc.pipe17.com/#/operations/fetchReturn

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17GetSingle } = require('../pipe17/pipe17.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['returnId'],
]);

const pipe17ReturnGet = async (
  credsPayload,
  returnId,
  {
    inspect = false,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    returnId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return pipe17GetSingle(
    credsPayload,
    '/returns',
    returnId,
    {
      resultKey: 'return',
      inspect,
      fetchClient,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17ReturnGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17ReturnGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "returnId": "969504fc181f7182"
  }'
*/
