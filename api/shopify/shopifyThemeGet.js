// https://shopify.dev/docs/api/admin-graphql/latest/queries/theme

const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAny } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyThemesGet } = require('../shopify/shopifyThemesGet');

const defaultAttrs = 'id name role createdAt updatedAt';

const themeIdentifierValidator = (themeIdentifier) => {
  return objHasAny(themeIdentifier, [
    'themeId',
    'themeName',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['themeIdentifier', themeIdentifierValidator],
]);

const shopifyThemeGet = async (
  credsPayload,
  themeIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, themeIdentifier });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    themeId,
    themeName,
  } = themeIdentifier;

  if (themeId) {
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
  }

  const themesResponse = await shopifyThemesGet(
    credsPayload,
    {
      apiVersion,
      attrs,
      names: [themeName],
      limit: 1,
    },
  );

  if (!themesResponse.ok) {
    return themesResponse;
  }

  const themes = themesResponse.data;

  if (!Array.isArray(themes) || !themes.length) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: `No theme found with name "${ themeName }"`,
      },
    };
  }

  return {
    ok: true,
    data: themes[0],
  };
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
    "themeIdentifier": { "themeId": "142724202556" }
  }'
*/
