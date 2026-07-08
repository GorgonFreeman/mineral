// https://shopify.dev/docs/api/admin-graphql/latest/mutations/themeUpdate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const normalizeThemeGid = (themeId) => {
  const themeIdString = String(themeId);

  if (themeIdString.startsWith('gid://')) {
    return themeIdString;
  }

  return `gid://shopify/OnlineStoreTheme/${ themeIdString }`;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['themeId'],
  ['updatePayload'],
]);

const shopifyThemeUpdate = async (
  credsPayload,
  themeId,
  updatePayload,
  /*
    name,
  */
  {
    apiVersion,
    returnThemeAttrs = 'id name role createdAt updatedAt',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    themeId,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'themeUpdate',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: normalizeThemeGid(themeId),
        },
        input: {
          type: 'OnlineStoreThemeInput!',
          value: updatePayload,
        },
      },
      returnSchema: `theme { ${ returnThemeAttrs } }`,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyThemeUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyThemeUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "themeId": "142724202556",
    "updatePayload": {
      "name": "My Theme | B 2026-07-08"
    }
  }'
*/
