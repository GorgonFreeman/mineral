// https://docs.stripe.com/api/charges/list

const { credsFromPayload, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeClient } = require('../stripe/stripe.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const stripeChargesGet = async (
  credsPayload,
  {
    params,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const response = await stripeClient.fetch({
    url: '/charges',
    params,
    context: { creds },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  stripeChargesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stripeChargesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stripe" },
    "options": {
      "params": { "limit": 10 }
    }
  }'
*/
