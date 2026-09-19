// https://shopify.dev/docs/api/storefront/latest/queries/article

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
  content
  excerpt
  publishedAt
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['articleId'],
]);

const shopifyStorefrontArticleGet = async (
  credsPayload,
  articleId,
  {
    apiVersion,
    attrs = defaultAttrs,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    articleId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const inContextDirective = buildInContextDirective(inContext);
  const id = articleId.toString().startsWith('gid://')
    ? articleId
    : `gid://shopify/Article/${ articleId }`;

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query StorefrontArticleById ($id: ID!)${ inContextDirective } {
            article(id: $id) {
              ${ attrs }
            }
          }
        `,
        variables: { id },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.article',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontArticleGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontArticleGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "articleId": "1234567890"
  }'
*/
