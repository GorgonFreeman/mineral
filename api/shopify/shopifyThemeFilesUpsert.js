// https://shopify.dev/docs/api/admin-graphql/latest/mutations/themeFilesUpsert

const { credsValidator } = require('../validators');
const { ArgsWarden, ensureArray, everyIfArray } = require('../utils');
const { shopifyMutationDo } = require('./shopifyMutationDo');

const themeFileInputValidator = ({
  filename,
  body,
} = {}) => Boolean(filename && body?.type && body?.value != null);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['themeId'],
  ['files', (files) => everyIfArray(themeFileInputValidator, files)],
]);

const shopifyThemeFilesUpsert = async (
  credsPayload,
  themeId,
  files,
  {
    apiVersion,
    returnSchema = `
      upsertedThemeFiles {
        filename
      }
      job {
        id
        done
      }
    `.trim(),
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    themeId,
    files,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'themeFilesUpsert',
    {
      mutationVariables: {
        themeId: {
          type: 'ID!',
          value: `gid://shopify/OnlineStoreTheme/${ themeId }`,
        },
        files: {
          type: '[OnlineStoreThemeFilesUpsertFileInput!]!',
          value: ensureArray(files),
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
  shopifyThemeFilesUpsert,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyThemeFilesUpsert" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "themeId": "129840808008",
    "files": {
      "filename": "templates/index.json",
      "body": {
        "type": "TEXT",
        "value": "{ \"sections\": {}, \"order\": [] }"
      }
    }
  }'
*/
