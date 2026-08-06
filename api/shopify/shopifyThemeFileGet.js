// https://shopify.dev/docs/api/admin-graphql/latest/queries/theme

const { credsValidator } = require('../validators');
const { ArgsWarden, ensureArray } = require('../utils');
const { shopifyClient } = require('./shopify.utils');

const defaultAttrs = `
  filename
  contentType
  size
  body {
    ... on OnlineStoreThemeFileBodyText {
      content
    }
    ... on OnlineStoreThemeFileBodyBase64 {
      contentBase64
    }
    ... on OnlineStoreThemeFileBodyUrl {
      url
    }
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['themeId'],
  ['filenames'],
]);

const shopifyThemeFileGet = async (
  credsPayload,
  themeId,
  filenames,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    themeId,
    filenames,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const filenamesList = ensureArray(filenames);

  const response = await shopifyClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query ThemeFiles($themeId: ID!, $filenames: [String!]!) {
            theme(id: $themeId) {
              files(filenames: $filenames) {
                nodes {
                  ${ attrs }
                }
                userErrors {
                  code
                  filename
                }
              }
            }
          }
        `,
        variables: {
          themeId: `gid://shopify/OnlineStoreTheme/${ themeId }`,
          filenames: filenamesList,
        },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.theme.files',
    },
  });

  if (!response.ok) {
    return response;
  }

  // stripEdgesAndNodes turns files.nodes into an array (userErrors on the
  // connection are dropped by the shared Shopify client pipeline).
  return {
    ok: true,
    data: ensureArray(response.data),
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyThemeFileGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyThemeFileGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "themeId": "129840808008",
    "filenames": "templates/page.sign_up_beauty.json"
  }'
*/
