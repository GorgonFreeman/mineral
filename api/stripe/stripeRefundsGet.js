// https://docs.stripe.com/api/refunds/list

const { credsFromPayload, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeClient } = require('../stripe/stripe.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const stripeRefundsGet = async (
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
    url: '/refunds',
    method: 'get',
    params,
    context: { creds },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  stripeRefundsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stripeRefundsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stripe" },
    "options": {
      "params": { "charge": "ch_123" }
    }
  }'
*/
