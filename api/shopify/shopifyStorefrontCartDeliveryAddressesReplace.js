// https://shopify.dev/docs/api/storefront/latest/mutations/cartDeliveryAddressesReplace

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

const shopifyStorefrontCartDeliveryAddressesReplace = async (
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
    'cartDeliveryAddressesReplace',
    {
      mutationVariables: {
        cartId: {
          type: 'ID!',
          value: cartId,
        },
        addresses: {
          type: '[CartSelectableAddressInput!]!',
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
  shopifyStorefrontCartDeliveryAddressesReplace,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartDeliveryAddressesReplace" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy",
    "addresses": [{"address":{"deliveryAddress":{"address1":"1 Main St","city":"Sydney","countryCode":"AU","zip":"2000"}}}],
  }'
*/
