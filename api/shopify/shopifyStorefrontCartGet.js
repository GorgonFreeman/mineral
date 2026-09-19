// https://shopify.dev/docs/api/storefront/latest/queries/cart

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
id
  checkoutUrl
  totalQuantity
  note
  cost {
    totalAmount { amount currencyCode }
    subtotalAmount { amount currencyCode }
  }
  lines(first: 50) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            product { id handle title }
          }
        }
      }
    }
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['cartId'],
]);

const shopifyStorefrontCartGet = async (
  credsPayload,
  cartId,
  {
    apiVersion,
    attrs = defaultAttrs,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    cartId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const inContextDirective = buildInContextDirective(inContext);

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query StorefrontCart ($id: ID!)${ inContextDirective } {
            cart(id: $id) {
              ${ attrs }
            }
          }
        `,
        variables: { id: cartId },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.cart',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontCartGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCartGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "cartId": "gid://shopify/Cart/c1-xxx?key=yyy"
  }'
*/
