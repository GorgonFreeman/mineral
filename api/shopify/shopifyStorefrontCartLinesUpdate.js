// https://shopify.dev/docs/api/storefront/latest/mutations/cartLinesUpdate

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

const shopifyStorefrontCartLinesUpdate = async (
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
    'cartLinesUpdate',
    {
      mutationVariables: {
        cartId: {
          type: 'ID!',
          value: cartId,
        },
        lines: {
          type: '[CartLineUpdateInput!]!',
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
  shopifyStorefrontCartLinesUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartLinesUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy",
    "lines": [{"id":"gid://shopify/CartLine/xxx","quantity":2}],
  }'
*/
