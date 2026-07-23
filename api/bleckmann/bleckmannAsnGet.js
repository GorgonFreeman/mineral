const { credsValidator } = require('./validators');
const { ArgsWarden } = require('./utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['arg'],
]);

const bleckmannAsnGet = async (
  credsPayload,
  arg,
  options = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, arg });
  if (rejectResponse) {
    return rejectResponse;
  }

  return {
    ok: true,
    data: {
      arg,
      options,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  bleckmannAsnGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/bleckmannAsnGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "arg": "1234"
  }'
*/
