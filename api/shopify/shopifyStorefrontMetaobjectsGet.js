// https://shopify.dev/docs/api/storefront/latest/queries/metaobjects

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyStorefrontGet, shopifyStorefrontGetter } = require('./shopifyStorefrontGet');

const defaultAttrs = `
id
  handle
  type
  updatedAt
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['type'],
]);

const shopifyStorefrontMetaobjectsGetInner = async (
  returnGetter,
  credsPayload,
  type,
  {
    attrs = defaultAttrs,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    type,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    'metaobject',
    {
      attrs,
      type,
      sortKeyType: 'String',
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
  shopifyStorefrontMetaobjectsGet: (...args) => shopifyStorefrontMetaobjectsGetInner(false, ...args),
  shopifyStorefrontMetaobjectsGetter: (...args) => shopifyStorefrontMetaobjectsGetInner(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontMetaobjectsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "type": "example_type",
    "options": {
      "limit": 10
    }
  }'
*/
