// https://shopify.dev/docs/api/storefront/latest/queries/page

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
  body
  bodySummary
`.trim();

const identifierValidator = (identifier) => objHasAny(identifier, ['id', 'handle']);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['pageIdentifier', identifierValidator],
]);

const shopifyStorefrontPageGet = async (
  credsPayload,
  pageIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    pageIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { id, handle } = pageIdentifier;
  const inContextDirective = buildInContextDirective(inContext);

  const useHandle = Boolean(handle);
  const queryName = useHandle ? 'StorefrontPageByHandle' : 'StorefrontPageById';
  const argDecl = useHandle ? '$handle: String!' : '$id: ID!';
  const argUse = useHandle ? 'handle: $handle' : 'id: $id';
  const variables = useHandle
    ? { handle }
    : { id: id.toString().startsWith('gid://') ? id : `gid://shopify/Page/${ id }` };

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query ${ queryName } (${ argDecl })${ inContextDirective } {
            page(${ argUse }) {
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
      resultPath: 'data.page',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontPageGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontPageGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "pageIdentifier": { "handle": "example" }
  }'
*/
