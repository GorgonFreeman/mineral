// https://shopify.dev/docs/api/storefront/latest/queries/metaobject

const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAny } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
  id
  handle
  type
  updatedAt
  fields {
    key
    value
    type
  }
`.trim();

const identifierValidator = (identifier) => {
  if (!identifier || typeof identifier !== 'object') {
    return false;
  }
  if (identifier.id) {
    return true;
  }
  return Boolean(identifier.handle?.handle && identifier.handle?.type);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['metaobjectIdentifier', identifierValidator],
]);

const shopifyStorefrontMetaobjectGet = async (
  credsPayload,
  metaobjectIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    metaobjectIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { id, handle } = metaobjectIdentifier;
  const inContextDirective = buildInContextDirective(inContext);

  if (handle) {
    return fetchClient.fetch({
      requestPayload: {
        method: 'post',
        body: {
          query: `
            query StorefrontMetaobjectByHandle ($handle: MetaobjectHandleInput!)${ inContextDirective } {
              metaobject(handle: $handle) {
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
        resultPath: 'data.metaobject',
      },
    });
  }

  const metaobjectGid = id.toString().startsWith('gid://')
    ? id
    : `gid://shopify/Metaobject/${ id }`;

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query StorefrontMetaobjectById ($id: ID!)${ inContextDirective } {
            metaobject(id: $id) {
              ${ attrs }
            }
          }
        `,
        variables: { id: metaobjectGid },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.metaobject',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontMetaobjectGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontMetaobjectGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "metaobjectIdentifier": {
      "handle": { "type": "size_chart", "handle": "mens-tees" }
    }
  }'
*/
