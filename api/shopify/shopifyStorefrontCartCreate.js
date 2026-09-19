// https://shopify.dev/docs/api/storefront/latest/mutations/cartCreate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const defaultReturnCartAttrs = `
id
  checkoutUrl
  totalQuantity
  note
  cost {
    totalAmount { amount currencyCode }
    subtotalAmount { amount currencyCode }
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyStorefrontCartCreate = async (
  credsPayload,
  {
    apiVersion,
    input,
    returnCartAttrs = defaultReturnCartAttrs,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartCreate',
    {
      mutationVariables: {
        ...input !== undefined && {
          input: {
            type: 'CartInput',
            value: input,
          },
        },
      },
      returnSchema: `
        cart { ${ returnCartAttrs } }
        warnings { code message }
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
  shopifyStorefrontCartCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "input": {
        "lines": [{ "merchandiseId": "gid://shopify/ProductVariant/123", "quantity": 1 }]
      }
    }
  }'
*/
