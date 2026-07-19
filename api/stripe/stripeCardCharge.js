const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeCardTokenCreate } = require('../stripe/stripeCardTokenCreate');
const { stripeChargeCreate } = require('../stripe/stripeChargeCreate');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['cardNumber'],
  ['expiryMonth'],
  ['expiryYear'],
  ['cvc'],
  ['amount'],
  ['currency'],
  ['description'],
]);

const stripeCardCharge = async (
  credsPayload,
  cardNumber,
  expiryMonth,
  expiryYear,
  cvc,
  amount,
  currency,
  description,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    cardNumber,
    expiryMonth,
    expiryYear,
    cvc,
    amount,
    currency,
    description,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const cardTokenResponse = await stripeCardTokenCreate(
    credsPayload,
    cardNumber,
    expiryMonth,
    expiryYear,
    cvc,
  );

  if (!cardTokenResponse?.ok) {
    return cardTokenResponse;
  }

  const cardToken = cardTokenResponse?.data?.id;

  if (!cardToken) {
    return {
      ok: false,
      error: {
        message: 'Failed to create card token',
      },
    };
  }

  const chargeResponse = await stripeChargeCreate(
    credsPayload,
    amount,
    currency,
    cardToken,
    description,
  );

  return chargeResponse;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  stripeCardCharge,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stripeCardCharge" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stripe" },
    "cardNumber": "4242424242424242",
    "expiryMonth": "01",
    "expiryYear": "2026",
    "cvc": "123",
    "currency": "AUD",
    "description": "Transaction helper",
    "amount": "50"
  }'
*/
