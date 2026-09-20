// https://shopify.dev/docs/api/admin-graphql/latest/queries/shop

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `
id
  name
  myshopifyDomain
  primaryDomain { host url }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyShopGet = async (
  credsPayload,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyGetSingle(
    credsPayload,
    'shop',
    null,
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
  shopifyShopGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyShopGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" }
  }'

curl -X POST "http://localhost:8000/shopifyShopGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.staging" },
    "options": {
      "attrs": "id name metafield(namespace: \\"custom\\", key: \\"stores_audit\\") { id namespace key type value }"
    }
  }'
*/
