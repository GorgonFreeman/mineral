// https://shopify.dev/docs/api/storefront/latest/mutations/cartDeliveryAddressesUpdate

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
  ['addresses'],
]);

const shopifyStorefrontCartDeliveryAddressesUpdate = async (
  credsPayload,
  cartId,
  addresses,
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
    addresses
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartDeliveryAddressesUpdate',
    {
      mutationVariables: {
        cartId: {
          type: 'ID!',
          value: cartId,
        },
        addresses: {
          type: '[CartSelectableAddressUpdateInput!]!',
          value: addresses,
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
  shopifyStorefrontCartDeliveryAddressesUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartDeliveryAddressesUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy",
    "addresses": [{"id":"gid://shopify/CartSelectableAddress/xxx","address":{"deliveryAddress":{"city":"Melbourne"}}}],
  }'
*/
