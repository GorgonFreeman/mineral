// https://shopify.dev/docs/api/storefront/latest/mutations/cartLinesRemove

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
  ['lineIds'],
]);

const shopifyStorefrontCartLinesRemove = async (
  credsPayload,
  cartId,
  lineIds,
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
    lineIds
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartLinesRemove',
    {
      mutationVariables: {
        cartId: {
          type: 'ID!',
          value: cartId,
        },
        lineIds: {
          type: '[ID!]!',
          value: lineIds,
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
  shopifyStorefrontCartLinesRemove,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartLinesRemove" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy",
    "lineIds": ["gid://shopify/CartLine/xxx"],
  }'
*/
