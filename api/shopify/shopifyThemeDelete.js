// https://shopify.dev/docs/api/admin-graphql/latest/mutations/themeDelete

const { credsValidator } = require('../validators');
const { actionSingleOrMultiple, ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['themeId'],
]);

const shopifyThemeDeleteSingle = async (
  credsPayload,
  themeId,
  {
    apiVersion,
    returnSchema = 'deletedThemeId',
  } = {},
) => {

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

const shopifyThemeDelete = async (
  credsPayload,
  themeId,
  {
    queueRunOptions,
    apiVersion,
    returnSchema = 'deletedThemeId',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, themeId });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    themeId,
    shopifyThemeDeleteSingle,
    (themeIdItem) => ({
      args: [credsPayload, themeIdItem, { apiVersion, returnSchema }],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
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

curl -X POST "http://localhost:8000/shopifyThemeDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "themeId": ["1234567890", "0987654321"]
  }'
*/
