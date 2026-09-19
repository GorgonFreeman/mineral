// https://shopify.dev/docs/api/storefront/latest/mutations/cartGiftCardCodesRemove

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
  ['appliedGiftCardIds'],
]);

const shopifyStorefrontCartGiftCardCodesRemove = async (
  credsPayload,
  cartId,
  appliedGiftCardIds,
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
    appliedGiftCardIds
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartGiftCardCodesRemove',
    {
      mutationVariables: {
        cartId: {
          type: 'ID!',
          value: cartId,
        },
        appliedGiftCardIds: {
          type: '[ID!]!',
          value: appliedGiftCardIds,
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
  shopifyStorefrontCartGiftCardCodesRemove,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartGiftCardCodesRemove" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy",
    "appliedGiftCardIds": ["gid://shopify/AppliedGiftCard/xxx"],
  }'
*/
