// https://docs.stripe.com/api/charges/retrieve

const { credsFromPayload, ArgsWarden } = require('../utils');
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

  const creds = await credsFromPayload(credsPayload);

  const response = await stripeClient.fetch({
    url: `/charges/${ chargeId }`,
    method: 'get',
    context: { creds },
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
