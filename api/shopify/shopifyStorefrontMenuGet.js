// https://shopify.dev/docs/api/storefront/latest/queries/menu

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
  id
  handle
  title
  itemsCount
  items {
    id
    title
    url
    type
    items {
      id
      title
      url
      type
    }
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['handle'],
]);

const shopifyStorefrontMenuGet = async (
  credsPayload,
  handle,
  {
    apiVersion,
    attrs = defaultAttrs,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    handle,
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
          query StorefrontMenu ($handle: String!)${ inContextDirective } {
            menu(handle: $handle) {
              ${ attrs }
            }
          }
        `,
        variables: { handle },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.menu',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontMenuGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontMenuGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "handle": "main-menu"
  }'
*/
