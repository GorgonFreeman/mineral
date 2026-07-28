// https://shopify.dev/docs/api/admin-graphql/latest/mutations/bulkoperationrunquery

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('./shopifyMutationDo');

const defaultReturnAttrs = `
  id
  type
  status
  objectCount
  url
  errorCode
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
]);

const shopifyBulkOperationRunQuery = async (
  credsPayload,
  query,
  {
    apiVersion,
    returnAttrs = defaultReturnAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'bulkOperationRunQuery',
    {
      mutationVariables: {
        query: {
          type: 'String!',
          value: query,
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
  shopifyBulkOperationRunQuery,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyBulkOperationRunQuery" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "query": "{ products { edges { node { id title handle } } } }"
  }'
*/
