// https://shopify.dev/docs/api/admin-graphql/latest/mutations/themeUpdate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['themeId'],
  ['updatePayload'],
]);

const shopifyThemeUpdate = async (
  credsPayload,
  themeId,
  updatePayload,
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
          value: `gid://shopify/OnlineStoreTheme/${ themeId }`,
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
    "themeId": "129840808008",
    "updatePayload": {
      "name": "The me theme"
    }
  }'
*/
