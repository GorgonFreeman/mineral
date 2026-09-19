// https://shopify.dev/docs/api/storefront/latest/mutations/cartLinesAdd

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
  ['cartId'],
  ['lines'],
]);

const shopifyStorefrontCartLinesAdd = async (
  credsPayload,
  cartId,
  lines,
  {
    apiVersion,
    returnCartAttrs = defaultReturnCartAttrs,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    cartId,
    lines
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartLinesAdd',
    {
      mutationVariables: {
        cartId: {
          type: 'ID!',
          value: cartId,
        },
        lines: {
          type: '[CartLineInput!]!',
          value: lines,
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
  shopifyStorefrontCartLinesAdd,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartLinesAdd" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy",
    "lines": [{"merchandiseId":"gid://shopify/ProductVariant/123","quantity":1}],
  }'
*/
