// https://shopify.dev/docs/api/storefront/latest/queries/productTypes

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { MAX_PER_PAGE } = require('./shopify.constants');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyStorefrontProductTypesGet = async (
  credsPayload,
  {
    apiVersion,
    first = MAX_PER_PAGE,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
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
          query StorefrontProductTypesGet ($first: Int!)${ inContextDirective } {
            productTypes(first: $first) {
              edges {
                node
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `,
        variables: {
          first,
        },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.productTypes',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontProductTypesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontProductTypesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": { "first": 50 }
  }'
*/
