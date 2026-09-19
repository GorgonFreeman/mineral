// https://shopify.dev/docs/api/storefront/latest/queries/pages

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyStorefrontGet, shopifyStorefrontGetter } = require('./shopifyStorefrontGet');

const defaultAttrs = `
id
  handle
  title
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyStorefrontPagesGetInner = async (
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
    'page',
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
  shopifyStorefrontPagesGet: (...args) => shopifyStorefrontPagesGetInner(false, ...args),
  shopifyStorefrontPagesGetter: (...args) => shopifyStorefrontPagesGetInner(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontPagesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
