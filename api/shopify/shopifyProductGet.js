// https://shopify.dev/docs/api/admin-graphql/latest/queries/product
// https://shopify.dev/docs/api/admin-graphql/latest/queries/productByIdentifier

const { credsValidator } = require('../validators');
const { objHasAny, ArgsWarden } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = 'id handle';

const productIdentifierValidator = (productIdentifier) => {
  return objHasAny(productIdentifier, [
    'productId',
    'handle',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productIdentifier', productIdentifierValidator],
]);

const shopifyProductGet = async (
  credsPayload,
  productIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    productId,
    handle,
  } = productIdentifier;

  if (!productId) {
    const query = `
      query GetProductByIdentifier ($identifier: ProductIdentifierInput!) {
        product: productByIdentifier(identifier: $identifier) {
          ${ attrs }
        }
      }
    `;

    const response = await shopifyClient.fetch({
      requestPayload: {
        method: 'post',
        body: {
          query,
          variables: {
            identifier: {
              ...(handle && { handle }),
            },
          },
        },
      },
      context: {
        credsPayload,
        apiVersion,
        resultPath: 'data.product',
      },
    });

    return response;
  }

  return shopifyGetSingle(
    credsPayload,
    'product',
    productId,
    {
      apiVersion,
      attrs,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyProductGet,
  funcApiConfig,
  productIdentifierValidator, // TODO: Consider moving to validators
};

/*
curl -X POST "http://localhost:8000/shopifyProductGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "productIdentifier": { "productId": "1234567890" }
  }'

curl -X POST "http://localhost:8000/shopifyProductGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "productIdentifier": { "handle": "master-ball" }
  }'
*/
