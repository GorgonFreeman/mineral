// https://docs.stripe.com/api/charges/create

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeClient } = require('../stripe/stripe.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['amountCents'],
  ['currency'],
  ['source'],
  ['description'],
]);

const stripeChargeCreate = async (
  credsPayload,
  amountCents,
  currency,
  source,
  description,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    amountCents,
    currency,
    source,
    description,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await stripeClient.fetch({
    requestPayload: {
      url: '/charges',
      method: 'post',
      body: {
        amount: amountCents,
        currency,
        source,
        description,
      },
    },
    context: { credsPayload },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  stripeChargeCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stripeChargeCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stripe" },
    "amountCents": "100",
    "currency": "AUD",
    "source": "tok_visa",
    "description": "small charge"
  }'
*/
