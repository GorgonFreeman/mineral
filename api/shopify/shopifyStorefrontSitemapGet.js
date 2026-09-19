// https://shopify.dev/docs/api/storefront/latest/queries/sitemap

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
  pagesCount {
    count
    precision
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['type'],
]);

const shopifyStorefrontSitemapGet = async (
  credsPayload,
  type,
  {
    apiVersion,
    attrs = defaultAttrs,
    page,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    type,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const inContextDirective = buildInContextDirective(inContext);

  const resourcesBlock = page !== undefined ? `
              resources(page: ${ page }) {
                items {
                  ... on SitemapResource {
                    handle
                    updatedAt
                  }
                }
                pageInfo {
                  hasNextPage
                }
              }
` : '';

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query StorefrontSitemap ($type: SitemapType!)${ inContextDirective } {
            sitemap(type: $type) {
              ${ attrs }
              ${ resourcesBlock }
            }
          }
        `,
        variables: { type },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.sitemap',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontSitemapGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontSitemapGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "type": "PRODUCT",
    "options": { "page": 1 }
  }'
*/
