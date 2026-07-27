// https://shopify.dev/docs/api/admin-graphql/latest/mutations/bulkOperationRunMutation

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('./shopifyMutationDo');

const defaultReturnAttrs = `
  id
  type
  status
  objectCount
  url
`;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['mutation'],
  ['stagedUploadPath'],
]);

const shopifyBulkOperationRunMutation = async (
  credsPayload,
  mutation,
  stagedUploadPath,
  {
    apiVersion,
    returnAttrs = defaultReturnAttrs,
    clientIdentifier,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    mutation,
    stagedUploadPath,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'bulkOperationRunMutation',
    {
      mutationVariables: {
        mutation: {
          type: 'String!',
          value: mutation,
        },
        stagedUploadPath: {
          type: 'String!',
          value: stagedUploadPath,
        },
        ...clientIdentifier && {
          clientIdentifier: {
            type: 'String',
            value: clientIdentifier,
          },
        },
      },
      returnSchema: `bulkOperation { ${ returnAttrs } }`,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyBulkOperationRunMutation,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyBulkOperationRunMutation" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "arg": "1234"
  }'
*/
