// https://shopify.dev/docs/api/storefront/latest/queries/publicApiVersions

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
  handle
  displayName
  supported
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyStorefrontPublicApiVersionsGet = async (
  credsPayload,
  {
    apiVersion,
    attrs = defaultAttrs,
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
          query StorefrontPublicApiVersions${ inContextDirective } {
            publicApiVersions {
              ${ attrs }
            }
          }
        `,
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.publicApiVersions',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontPublicApiVersionsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontPublicApiVersionsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" }
  }'
*/
