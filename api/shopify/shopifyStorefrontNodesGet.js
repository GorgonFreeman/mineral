// https://shopify.dev/docs/api/storefront/latest/queries/nodes

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
  id
  ... on Product {
    handle
    title
  }
  ... on Collection {
    handle
    title
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['gids'],
]);

const shopifyStorefrontNodesGet = async (
  credsPayload,
  gids,
  {
    apiVersion,
    attrs = defaultAttrs,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    gids,
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
          query StorefrontNodes ($ids: [ID!]!)${ inContextDirective } {
            nodes(ids: $ids) {
              ${ attrs }
            }
          }
        `,
        variables: { ids: gids },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.nodes',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontNodesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontNodesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "gids": ["gid://shopify/Product/123", "gid://shopify/Collection/456"]
  }'
*/
