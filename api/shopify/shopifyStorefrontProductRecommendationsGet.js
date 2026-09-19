// https://shopify.dev/docs/api/storefront/latest/queries/productRecommendations

const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAny } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
  id
  handle
  title
  availableForSale
`.trim();

const identifierValidator = (identifier) => objHasAny(identifier, ['productId', 'productHandle']);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productIdentifier', identifierValidator],
]);

const shopifyStorefrontProductRecommendationsGet = async (
  credsPayload,
  productIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
    intent,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { productId, productHandle } = productIdentifier;
  const inContextDirective = buildInContextDirective(inContext);

  const queryTypeDeclaration = [
    ...productHandle ? ['$productHandle: String'] : [],
    ...productId ? ['$productId: ID'] : [],
    ...intent ? ['$intent: ProductRecommendationIntent'] : [],
  ].join('\n');

  const queryVariableDeclaration = [
    ...productHandle ? ['productHandle: $productHandle'] : [],
    ...productId ? ['productId: $productId'] : [],
    ...intent ? ['intent: $intent'] : [],
  ].join('\n');

  const variables = {
    ...productHandle && { productHandle },
    ...productId && {
      productId: productId.toString().startsWith('gid://')
        ? productId
        : `gid://shopify/Product/${ productId }`,
    },
    ...intent && { intent },
  };

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query StorefrontProductRecommendations (
            ${ queryTypeDeclaration }
          )${ inContextDirective } {
            productRecommendations(
              ${ queryVariableDeclaration }
            ) {
              ${ attrs }
            }
          }
        `,
        variables,
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.productRecommendations',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontProductRecommendationsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontProductRecommendationsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "productIdentifier": { "productHandle": "offstage-hoodie-moon" },
    "options": { "intent": "RELATED" }
  }'
*/
