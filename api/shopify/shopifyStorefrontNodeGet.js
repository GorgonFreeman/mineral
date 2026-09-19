// https://shopify.dev/docs/api/storefront/latest/queries/node

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
  ... on Page {
    handle
    title
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['gid'],
]);

const shopifyStorefrontNodeGet = async (
  credsPayload,
  gid,
  {
    apiVersion,
    attrs = defaultAttrs,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    gid,
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
          query StorefrontNode ($id: ID!)${ inContextDirective } {
            node(id: $id) {
              ${ attrs }
            }
          }
        `,
        variables: { id: gid },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.node',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontNodeGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontNodeGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "gid": "gid://shopify/Product/123"
  }'
*/
