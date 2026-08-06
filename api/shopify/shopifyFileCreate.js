// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fileCreate

const { credsValidator } = require('../validators');
const { ArgsWarden, ensureArray, everyIfArray } = require('../utils');
const { shopifyMutationDo } = require('./shopifyMutationDo');

const fileInputValidator = ({ originalSource } = {}) => Boolean(originalSource);

const defaultReturnFileAttrs = `
  id
  fileStatus
  alt
  fileErrors {
    code
    details
    message
  }
  preview {
    image {
      url
    }
  }
  ... on MediaImage {
    image {
      url
    }
  }
  ... on GenericFile {
    url
  }
  ... on Video {
    originalSource {
      url
    }
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fileInput', (fileInput) => everyIfArray(fileInputValidator, fileInput)],
]);

const shopifyFileCreate = async (
  credsPayload,
  fileInput,
  {
    apiVersion,
    returnFileAttrs = defaultReturnFileAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fileInput,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'fileCreate',
    {
      mutationVariables: {
        files: {
          type: '[FileCreateInput!]!',
          value: ensureArray(fileInput).map(({
            filename,
            originalSource,
            contentType,
            alt,
            duplicateResolutionMode,
          }) => ({
            originalSource,
            ...(filename && { filename }),
            ...(contentType && { contentType }),
            ...(alt && { alt }),
            ...(duplicateResolutionMode && { duplicateResolutionMode }),
          })),
        },
      },
      returnSchema: `files { ${ returnFileAttrs } }`,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyFileCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyFileCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "fileInput": {
      "originalSource": "https://upload.wikimedia.org/wikipedia/en/5/5f/Original_Doge_meme.jpg",
      "filename": "doge.jpg"
    }
  }'
*/
