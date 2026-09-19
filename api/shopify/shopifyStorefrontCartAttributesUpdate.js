// https://shopify.dev/docs/api/storefront/latest/mutations/cartAttributesUpdate

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
  ['attributes'],
]);

const shopifyStorefrontCartAttributesUpdate = async (
  credsPayload,
  cartId,
  attributes,
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
    attributes
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'cartAttributesUpdate',
    {
      mutationVariables: {
        cartId: {
          type: 'ID!',
          value: cartId,
        },
        attributes: {
          type: '[AttributeInput!]!',
          value: attributes,
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
  shopifyStorefrontCartAttributesUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartAttributesUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy",
    "attributes": [{"key":"gift","value":"true"}],
  }'
*/
