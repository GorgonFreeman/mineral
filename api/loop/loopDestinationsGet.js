const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { loopGet } = require('../loop/loopGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const loopDestinationsGet = async (
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

  return loopGet(credsPayload, '/destinations', {
    resultsKey: 'destinations',
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  loopDestinationsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/loopDestinationsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "loop.au" }
  }'
*/
