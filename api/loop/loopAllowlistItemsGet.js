const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { loopGet } = require('../loop/loopGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const loopAllowlistItemsGet = async (
  credsPayload,
  {
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return loopGet(credsPayload, '/allowlists', {
    resultsKey: 'data',
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  loopAllowlistItemsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/loopAllowlistItemsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "loop.au" }
  }'
*/
