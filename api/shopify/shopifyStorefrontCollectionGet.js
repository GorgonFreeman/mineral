// https://shopify.dev/docs/api/storefront/latest/queries/collection

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
  description
`.trim();

const identifierValidator = (identifier) => objHasAny(identifier, ['id', 'handle']);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['collectionIdentifier', identifierValidator],
]);

const shopifyStorefrontCollectionGet = async (
  credsPayload,
  collectionIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    collectionIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { id, handle } = collectionIdentifier;
  const inContextDirective = buildInContextDirective(inContext);

  const useHandle = Boolean(handle);
  const queryName = useHandle ? 'StorefrontCollectionByHandle' : 'StorefrontCollectionById';
  const argDecl = useHandle ? '$handle: String!' : '$id: ID!';
  const argUse = useHandle ? 'handle: $handle' : 'id: $id';
  const variables = useHandle
    ? { handle }
    : { id: id.toString().startsWith('gid://') ? id : `gid://shopify/Collection/${ id }` };

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query ${ queryName } (${ argDecl })${ inContextDirective } {
            collection(${ argUse }) {
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
      resultPath: 'data.collection',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontCollectionGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCollectionGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "collectionIdentifier": { "handle": "example" }
  }'
*/
