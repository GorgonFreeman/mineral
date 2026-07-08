// https://shopify.dev/docs/api/admin-graphql/latest/queries/themes

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyGet } = require('../shopify/shopifyGet');

const defaultAttrs = 'id name role createdAt updatedAt';

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyThemesGet = async (
  credsPayload,
  {
    apiVersion,
    attrs = defaultAttrs,
    roles,
    names,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyGet(
    credsPayload,
    'theme',
    {
      apiVersion,
      attrs,
      roles,
      names,
      ...getterOptions,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyThemesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyThemesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" }
  }'

curl -X POST "http://localhost:8000/shopifyThemesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "roles": ["MAIN"],
      "attrs": "id name role"
    }
  }'
*/
