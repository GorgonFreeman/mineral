// https://shopify.dev/docs/api/admin-graphql/latest/queries/collections

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet, shopifyGetter } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyCollectionsGet = async (
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
    'collection', 
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
  shopifyCollectionsGet: (...args) => shopifyCollectionsGet(false, ...args),
  shopifyCollectionsGetter: (...args) => shopifyCollectionsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCollectionsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
