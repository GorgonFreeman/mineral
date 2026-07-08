// https://shopify.dev/docs/api/admin-graphql/latest/mutations/themeDelete

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['themeId'],
]);

const shopifyThemeDelete = async (
  credsPayload,
  themeId,
  {
    apiVersion,
    returnSchema = 'deletedThemeId',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, themeId });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'themeDelete',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: `gid://shopify/OnlineStoreTheme/${ themeId }`,
        },
      },
      returnSchema,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyThemeDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyThemeDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "themeId": "1234567890"
  }'
*/
