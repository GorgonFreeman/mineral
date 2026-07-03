const { credsValidator } = require('./validators');
const { responseIfRejectingArgs } = require('./utils');

const validatorsByArg = {
  credsPayload: credsValidator,
  arg: Boolean,
};

const FUNC = async (
  credsPayload,
  arg,
  options = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, arg });
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
  argNames: ['credsPayload', 'arg'],
  validatorsByArg,
};

module.exports = {
  FUNC,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/FUNC" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "arg": "1234"
  }'
*/
