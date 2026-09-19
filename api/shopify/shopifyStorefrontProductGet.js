// https://shopify.dev/docs/api/storefront/latest/queries/product

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
  productType
  vendor
`.trim();

const identifierValidator = (identifier) => objHasAny(identifier, ['id', 'handle']);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productIdentifier', identifierValidator],
]);

const shopifyStorefrontProductGet = async (
  credsPayload,
  productIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
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

  const { id, handle } = productIdentifier;
  const inContextDirective = buildInContextDirective(inContext);

  const useHandle = Boolean(handle);
  const queryName = useHandle ? 'StorefrontProductByHandle' : 'StorefrontProductById';
  const argDecl = useHandle ? '$handle: String!' : '$id: ID!';
  const argUse = useHandle ? 'handle: $handle' : 'id: $id';
  const variables = useHandle
    ? { handle }
    : { id: id.toString().startsWith('gid://') ? id : `gid://shopify/Product/${ id }` };

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query ${ queryName } (${ argDecl })${ inContextDirective } {
            product(${ argUse }) {
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
      resultPath: 'data.product',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontProductGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontProductGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "productIdentifier": { "handle": "offstage-hoodie-moon" }
  }'
*/
