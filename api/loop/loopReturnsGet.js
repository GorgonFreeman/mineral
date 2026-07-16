const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { loopGet } = require('../loop/loopGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const loopReturnsGet = async (
  credsPayload,
  {
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  return loopGet(credsPayload, '/warehouse/return/list', {
    resultsKey: 'returns',
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  loopReturnsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/loopReturnsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "loop.au" },
    "options": {
      "limit": 20,
      "perPage": 7
    }
  }'
*/
