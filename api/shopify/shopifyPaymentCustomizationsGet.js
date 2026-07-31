// https://shopify.dev/docs/api/admin-graphql/latest/queries/paymentCustomizations

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyPaymentCustomizationsGet = async (
  credsPayload,
  {
    ...getterOptions // e.g. limit
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return await shopifyGet(credsPayload, 'paymentCustomization', { ...getterOptions });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyPaymentCustomizationsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyPaymentCustomizationsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
