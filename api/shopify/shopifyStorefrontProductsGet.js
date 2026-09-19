// https://shopify.dev/docs/api/storefront/latest/queries/products

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyStorefrontGet, shopifyStorefrontGetter } = require('./shopifyStorefrontGet');

const defaultAttrs = `
id
  handle
  title
  availableForSale
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyStorefrontProductsGetInner = async (
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
    'product',
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
  shopifyStorefrontProductsGet: (...args) => shopifyStorefrontProductsGetInner(false, ...args),
  shopifyStorefrontProductsGetter: (...args) => shopifyStorefrontProductsGetInner(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontProductsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
