// https://shopify.dev/docs/api/admin-graphql/latest/mutations/themeDuplicate

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
]);

const shopifyThemeDuplicate = async (
  credsPayload,
  themeId,
  {
    apiVersion,
    name,
    returnThemeAttrs = 'id name role createdAt',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, themeId });
  if (rejectResponse) {
    return rejectResponse;
  }

  const mutationVariables = {
    id: {
      type: 'ID!',
      value: normalizeThemeGid(themeId),
    },
    ...name !== undefined && {
      name: {
        type: 'String',
        value: name,
      },
    },
  };

  return shopifyMutationDo(
    credsPayload,
    'themeDuplicate',
    {
      mutationVariables,
      returnSchema: `newTheme { ${ returnThemeAttrs } }`,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyThemeDuplicate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyThemeDuplicate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "themeId": "142724202556",
    "options": {
      "name": "My Theme | B 2026-07-08"
    }
  }'
*/
