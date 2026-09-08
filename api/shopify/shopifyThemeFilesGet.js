// https://shopify.dev/docs/api/admin-graphql/latest/objects/OnlineStoreTheme#connection-files

const { ArgsWarden, Getter, ensureArray, getWithLocalCachedFile } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');
const { shopifyGetPaginator, shopifyGetDigester } = require('./shopifyGet');
const { MAX_PER_PAGE } = require('./shopify.constants');

const defaultAttrs = 'filename';

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['themeId'],
]);

const shopifyThemeFilesGetPacket = async (
  credsPayload,
  themeId,
  attrs,
  {
    apiVersion,

    perPage = MAX_PER_PAGE,
    cursor,
    // Supports globs, e.g. templates/page.*
    filenames,
  } = {},
) => {

  return await shopifyClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
        query GetThemeFiles (
          $themeId: ID!
          $first: Int!
          $cursor: String
          ${ filenames ? '$filenames: [String!]' : '' }
        ) {
          theme(id: $themeId) {
            files(
              first: $first
              after: $cursor
              ${ filenames ? 'filenames: $filenames' : '' }
            ) {
              nodes {
                ${ attrs }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `,
        variables: {
          themeId: `gid://shopify/OnlineStoreTheme/${ themeId }`,
          first: perPage,
          cursor,
          ...filenames && { filenames: ensureArray(filenames) },
        },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.theme.files',
    },
  });
};

const shopifyThemeFilesGet = async (
  returnGetter, // Always bound

  credsPayload,
  themeId,
  {
    apiVersion,

    attrs = defaultAttrs,
    perPage = MAX_PER_PAGE,
    cursor,
    filenames,

    useLocalCachedFile,
    ...getterOptions // e.g. limit
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    themeId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getter = new Getter(
    {
      args: [
        credsPayload,
        themeId,
        attrs,
      ],
      options: {
        apiVersion,
        perPage,
        cursor,
        filenames,
      },
    },
    {
      func: shopifyThemeFilesGetPacket,
      digester: shopifyGetDigester,
      paginator: shopifyGetPaginator,
      ...getterOptions,
    },
  );

  if (returnGetter) {
    return getter;
  }

  return getWithLocalCachedFile(
    useLocalCachedFile,
    async () => {
      const data = await getter.run({ returnAll: true });

      return {
        ok: true,
        data,
      };
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyThemeFilesGet: (...args) => shopifyThemeFilesGet(false, ...args),
  shopifyThemeFilesGetter: (...args) => shopifyThemeFilesGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyThemeFilesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "themeId": "130370109512"
  }'

curl -X POST "http://localhost:8000/shopifyThemeFilesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "themeId": "130370109512",
    "options": {
      "filenames": "templates/*"
    }
  }'
*/
