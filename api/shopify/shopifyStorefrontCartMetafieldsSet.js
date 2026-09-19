// https://shopify.dev/docs/api/storefront/latest/mutations/cartMetafieldsSet

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const defaultReturnMetafieldAttrs = `
  id
  namespace
  key
  value
  type
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['metafields'],
]);

const shopifyStorefrontCartMetafieldsSet = async (
  credsPayload,
  metafields,
  {
    apiVersion,
    returnMetafieldAttrs = defaultReturnMetafieldAttrs,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    metafields,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartMetafieldsSet',
    {
      mutationVariables: {
        metafields: {
          type: '[CartMetafieldsSetInput!]!',
          value: metafields,
        },
      },
      returnSchema: `
        metafields { ${ returnMetafieldAttrs } }
      `.trim(),
      apiVersion,
      inContext,
      ...fetchClient ? { fetchClient } : {},
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontCartMetafieldsSet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartMetafieldsSet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "metafields": [{
      "ownerId": "gid://shopify/Cart/c1-xxx?key=yyy",
      "key": "custom.note",
      "type": "single_line_text_field",
      "value": "hello"
    }]
  }'
*/
