// https://shopify.dev/docs/api/storefront/latest/queries/articles

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyStorefrontGet, shopifyStorefrontGetter } = require('./shopifyStorefrontGet');

const defaultAttrs = `
id
  handle
  title
  publishedAt
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyStorefrontArticlesGetInner = async (
  returnGetter,
  credsPayload,
  {
    attrs = defaultAttrs,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    'article',
    {
      attrs,
      ...getterOptions,
    },
  ];

  return returnGetter
    ? shopifyStorefrontGetter(...getterArgs)
    : shopifyStorefrontGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontArticlesGet: (...args) => shopifyStorefrontArticlesGetInner(false, ...args),
  shopifyStorefrontArticlesGetter: (...args) => shopifyStorefrontArticlesGetInner(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontArticlesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
