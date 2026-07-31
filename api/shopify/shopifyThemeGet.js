// https://shopify.dev/docs/api/admin-graphql/latest/queries/theme

const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAny } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = 'id name role createdAt updatedAt';

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['themeId'],
]);

const shopifyThemeGet = async (
  credsPayload,
  themeId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    themeId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyGetSingle(
    credsPayload,
    'theme',
    themeId,
    {
      apiVersion,
      attrs,
      gidType: 'OnlineStoreTheme',
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyThemeGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyThemeGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "themeId": "129840808008"
  }'
*/
