// https://docs.stripe.com/api/charges/retrieve

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeClient } = require('../stripe/stripe.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['chargeId'],
]);

const stripeChargeGet = async (
  credsPayload,
  chargeId,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    chargeId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await stripeClient.fetch({
    requestPayload: {
      url: `/charges/${ chargeId }`,
    },
    context: { credsPayload },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  stripeChargeGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stripeChargeGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stripe" },
    "chargeId": "ch_123"
  }'
*/
