// https://shopify.dev/docs/api/storefront/latest/mutations/cartGiftCardCodesAdd

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
  ['giftCardCodes'],
]);

const shopifyStorefrontCartGiftCardCodesAdd = async (
  credsPayload,
  cartId,
  giftCardCodes,
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
    giftCardCodes
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartGiftCardCodesAdd',
    {
      mutationVariables: {
        cartId: {
          type: 'ID!',
          value: cartId,
        },
        giftCardCodes: {
          type: '[String!]!',
          value: giftCardCodes,
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
  shopifyStorefrontCartGiftCardCodesAdd,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartGiftCardCodesAdd" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy",
    "giftCardCodes": ["ABCD-EFGH-IJKL"],
  }'
*/
