// https://docs.stripe.com/api/tokens/create_card

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeClient } = require('../stripe/stripe.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['cardNumber'],
  ['expiryMonth'],
  ['expiryYear'],
  ['cvc'],
]);

const stripeCardTokenCreate = async (
  credsPayload,
  cardNumber,
  expiryMonth,
  expiryYear,
  cvc,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    cardNumber,
    expiryMonth,
    expiryYear,
    cvc,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await stripeClient.fetch({
    requestPayload: {
      url: '/tokens',
      method: 'post',
      body: {
        'card[number]': cardNumber,
        'card[exp_month]': expiryMonth,
        'card[exp_year]': expiryYear,
        'card[cvc]': cvc,
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
  stripeCardTokenCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stripeCardTokenCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stripe" },
    "cardNumber": "4242424242424242",
    "expiryMonth": "01",
    "expiryYear": "2030",
    "cvc": "123"
  }'
*/
