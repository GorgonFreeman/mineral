// https://docs.stripe.com/api/refunds/create

const { credsFromPayload, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeClient } = require('../stripe/stripe.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['chargeId'],
]);

const stripeRefundCreate = async (
  credsPayload,
  chargeId,
  {
    amountCents,
    reason,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    chargeId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const response = await stripeClient.fetch({
    url: '/refunds',
    method: 'post',
    body: {
      charge: chargeId,
      ...amountCents && { amount: amountCents },
      ...reason && { reason },
    },
    context: { creds },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  stripeRefundCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stripeRefundCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stripe" },
    "chargeId": "ch_123",
    "options": {
      "amountCents": "100"
    }
  }'
*/
