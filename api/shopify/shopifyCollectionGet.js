// https://shopify.dev/docs/api/admin-graphql/latest/queries/collection

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = 'id title handle';

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['collectionId'],
]);

const shopifyCollectionGet = async (
  credsPayload,
  collectionId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, collectionId });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyGetSingle(
    credsPayload,
    'collection',
    collectionId,
    {
      apiVersion,
      attrs,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyCollectionGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCollectionGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "collectionId": "279980277832"
  }'
*/
