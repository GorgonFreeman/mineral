// https://shopify.dev/docs/api/admin-graphql/latest/queries/metafieldDefinitions

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ownerType'],
]);

const shopifyMetafieldDefinitionsGet = async (
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

  return await shopifyGet(credsPayload, 'metafieldDefinition', { ownerType, ...getterOptions });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMetafieldDefinitionsGet,
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
