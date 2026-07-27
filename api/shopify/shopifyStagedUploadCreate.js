// https://shopify.dev/docs/api/admin-graphql/latest/mutations/stagedUploadsCreate

const { credsValidator } = require('../validators');
const { ArgsWarden, ensureArray, everyIfArray } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const defaultReturnAttrs = `
  url
  resourceUrl
  parameters {
    name
    value
  }
`;

const stagedUploadInputItemValidator = ({
  resource,
  filename,
  mimeType,
} = {}) => Boolean(resource && filename && mimeType);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['stagedUploadInput', (i) => everyIfArray(stagedUploadInputItemValidator, i)],
]);

const shopifyStagedUploadCreate = async (
  credsPayload,
  stagedUploadInput,
  {
    apiVersion,
    returnAttrs = defaultReturnAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    stagedUploadInput,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const input = ensureArray(stagedUploadInput).map(({
    resource,
    filename,
    mimeType,
    fileSize,
    httpMethod,
  }) => ({
    resource,
    filename,
    mimeType,
    ...fileSize && { fileSize: String(fileSize) },
    ...httpMethod && { httpMethod },
  }));

  return shopifyMutationDo(
    credsPayload,
    'stagedUploadsCreate',
    {
      mutationVariables: {
        input: {
          type: '[StagedUploadInput!]!',
          value: input,
        },
      },
      returnSchema: `stagedTargets { ${ returnAttrs } }`,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStagedUploadCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStagedUploadCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "stagedUploadInput": {
      "resource": "BULK_MUTATION_VARIABLES",
      "filename": "inputs.jsonl",
      "mimeType": "text/jsonl",
      "httpMethod": "POST"
    }
  }'
  }'
*/
