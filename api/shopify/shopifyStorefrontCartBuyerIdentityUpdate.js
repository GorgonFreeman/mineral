// https://shopify.dev/docs/api/storefront/latest/mutations/cartBuyerIdentityUpdate

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
  ['buyerIdentity'],
]);

const shopifyStorefrontCartBuyerIdentityUpdate = async (
  credsPayload,
  cartId,
  buyerIdentity,
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
    buyerIdentity
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartBuyerIdentityUpdate',
    {
      mutationVariables: {
        cartId: {
          type: 'ID!',
          value: cartId,
        },
        buyerIdentity: {
          type: 'CartBuyerIdentityInput!',
          value: buyerIdentity,
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
  shopifyStorefrontCartBuyerIdentityUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartBuyerIdentityUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy",
    "buyerIdentity": {"countryCode":"AU"},
  }'
*/
