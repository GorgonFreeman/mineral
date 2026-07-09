// https://shopify.dev/docs/api/admin-graphql/latest/queries/customers

const { credsFromPayload, Getter, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyCustomersGet = async (
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

  return await shopifyGet(credsPayload, 'customer', { ...getterOptions });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyCustomersGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCustomersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" }
  }'

curl -X POST "http://localhost:8000/shopifyCustomersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
