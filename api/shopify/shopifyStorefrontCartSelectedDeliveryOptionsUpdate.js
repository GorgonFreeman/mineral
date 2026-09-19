// https://shopify.dev/docs/api/storefront/latest/mutations/cartSelectedDeliveryOptionsUpdate

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
  ['selectedDeliveryOptions'],
]);

const shopifyStorefrontCartSelectedDeliveryOptionsUpdate = async (
  credsPayload,
  cartId,
  selectedDeliveryOptions,
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
    selectedDeliveryOptions
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartSelectedDeliveryOptionsUpdate',
    {
      mutationVariables: {
        cartId: {
          type: 'ID!',
          value: cartId,
        },
        selectedDeliveryOptions: {
          type: '[CartSelectedDeliveryOptionInput!]!',
          value: selectedDeliveryOptions,
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
  shopifyStorefrontCartSelectedDeliveryOptionsUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartSelectedDeliveryOptionsUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy",
    "selectedDeliveryOptions": [{"deliveryGroupId":"gid://shopify/CartDeliveryGroup/xxx","deliveryOptionHandle":"standard"}],
  }'
*/
