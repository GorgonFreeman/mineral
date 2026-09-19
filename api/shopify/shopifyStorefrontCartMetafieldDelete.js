// https://shopify.dev/docs/api/storefront/latest/mutations/cartMetafieldDelete

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['input'],
]);

const shopifyStorefrontCartMetafieldDelete = async (
  credsPayload,
  input,
  {
    apiVersion,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    input,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartMetafieldDelete',
    {
      mutationVariables: {
        input: {
          type: 'CartMetafieldDeleteInput!',
          value: input,
        },
      },
      returnSchema: `
        deletedId
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
  shopifyStorefrontCartMetafieldDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartMetafieldDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "input": {
      "ownerId": "gid://shopify/Cart/c1-xxx?key=yyy",
      "key": "custom.note"
    }
  }'
*/
