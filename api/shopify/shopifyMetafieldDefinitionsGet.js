// https://shopify.dev/docs/api/admin-graphql/latest/queries/metafieldDefinitions

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet, shopifyGetter } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ownerType'],
]);

const shopifyMetafieldDefinitionsGet = async (
  returnGetter, // Always bound

  credsPayload,
  ownerType,
  {
    ...getterOptions // e.g. limit
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ 
    credsPayload,
    ownerType,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload, 
    'metafieldDefinition', 
    {
      ownerType,
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
  shopifyMetafieldDefinitionsGet: (...args) => shopifyMetafieldDefinitionsGet(false, ...args),
  shopifyMetafieldDefinitionsGetter: (...args) => shopifyMetafieldDefinitionsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetafieldDefinitionsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "ownerType": "PRODUCT",
    "options": {
      "limit": 10
    }
  }'
*/
