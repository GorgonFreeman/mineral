// https://docs.stripe.com/api/charges/capture

const { credsFromPayload, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeClient } = require('../stripe/stripe.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['chargeId'],
]);

const stripeChargeCapture = async (
  credsPayload,
  chargeId,
  {
    amountCents,
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
    url: `/charges/${ chargeId }/capture`,
    method: 'post',
    ...(amountCents && {
      body: {
        amount: amountCents,
      },
    }),
    context: { creds },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  stripeChargeCapture,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stripeChargeCapture" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stripe" },
    "chargeId": "ch_123",
    "options": {
      "amountCents": "100"
    }
  }'
*/
