// https://docs.stripe.com/api/charges/create

const { credsFromPayload, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeClient } = require('../stripe/stripe.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['amount'],
  ['currency'],
  ['source'],
  ['description'],
]);

const stripeChargeCreate = async (
  credsPayload,
  amount,
  currency,
  source,
  description,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    amount,
    currency,
    source,
    description,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const response = await stripeClient.fetch({
    url: '/charges',
    method: 'post',
    body: {
      amount,
      currency,
      source,
      description,
    },
    context: { creds },
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
    "amount": "100",
    "currency": "AUD",
    "source": "tok_visa",
    "description": "small charge"
  }'
*/
