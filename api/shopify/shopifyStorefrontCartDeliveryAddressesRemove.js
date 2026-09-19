// https://shopify.dev/docs/api/storefront/latest/mutations/cartDeliveryAddressesRemove

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
  ['addressIds'],
]);

const shopifyStorefrontCartDeliveryAddressesRemove = async (
  credsPayload,
  cartId,
  addressIds,
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
    addressIds
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartDeliveryAddressesRemove',
    {
      mutationVariables: {
        cartId: {
          type: 'ID!',
          value: cartId,
        },
        addressIds: {
          type: '[ID!]!',
          value: addressIds,
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
  shopifyStorefrontCartDeliveryAddressesRemove,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartDeliveryAddressesRemove" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy",
    "addressIds": ["gid://shopify/CartSelectableAddress/xxx"],
  }'
*/
