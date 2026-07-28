// https://shopify.dev/docs/api/admin-graphql/latest/queries/customers

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet, shopifyGetter } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyCustomersGet = async (
  returnGetter, // Always bound

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

  const getterArgs = [
    credsPayload, 
    'customer', 
    {
      ...getterOptions,
    },
  ];

  return returnGetter
    ? shopifyGetter(...getterArgs)
    : shopifyGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyCustomersGet: (...args) => shopifyCustomersGet(false, ...args),
  shopifyCustomersGetter: (...args) => shopifyCustomersGet(true, ...args),
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
