// https://shopify.dev/docs/api/storefront/latest/queries/blog

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
`.trim();

const identifierValidator = (identifier) => objHasAny(identifier, ['id', 'handle']);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['blogIdentifier', identifierValidator],
]);

const shopifyStorefrontBlogGet = async (
  credsPayload,
  blogIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    blogIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { id, handle } = blogIdentifier;
  const inContextDirective = buildInContextDirective(inContext);

  if (handle) {
    return fetchClient.fetch({
      requestPayload: {
        method: 'post',
        body: {
          query: `
            query StorefrontBlogByHandle ($handle: String!)${ inContextDirective } {
              blog: blogByHandle(handle: $handle) {
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
        resultPath: 'data.blog',
      },
    });
  }

  const blogGid = id.toString().startsWith('gid://')
    ? id
    : `gid://shopify/Blog/${ id }`;

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query StorefrontBlogById ($id: ID!)${ inContextDirective } {
            blog(id: $id) {
              ${ attrs }
            }
          }
        `,
        variables: { id: blogGid },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.blog',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontBlogGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontBlogGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "blogIdentifier": { "handle": "news" }
  }'
*/
