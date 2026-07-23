const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeClient } = require('../stripe/stripe.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['arg'],
]);

const FUNC = async (
  credsPayload,
  arg,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, arg });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await stripeClient.fetch({
    requestPayload: {
      url: '/things',
      method: 'post',
      body: { arg },
    },
    context: { credsPayload },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  FUNC,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/FUNC" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stripe" },
    "arg": "1234"
  }'
*/
