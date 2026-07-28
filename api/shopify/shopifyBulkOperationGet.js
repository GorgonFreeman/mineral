// https://shopify.dev/docs/api/admin-graphql/latest/queries/bulkOperation

const { credsValidator } = require('../validators');
const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { shopifyGetSingle } = require('./shopifyGetSingle');

const defaultAttrs = `
  id
  status
  type
  objectCount
  url
  errorCode
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['bulkOperationId'],
]);

const shopifyBulkOperationGetSingle = async (
  credsPayload,
  bulkOperationId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {
  return shopifyGetSingle(
    credsPayload,
    'bulkOperation',
    bulkOperationId,
    {
      apiVersion,
      attrs,
    },
  );
};

const shopifyBulkOperationGet = async (
  credsPayload,
  bulkOperationId,
  {
    queueRunOptions,
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    bulkOperationId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    bulkOperationId,
    shopifyBulkOperationGetSingle,
    (bulkOperationIdItem) => ({
      args: [credsPayload, bulkOperationIdItem, { apiVersion, attrs }],
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
  shopifyBulkOperationGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyBulkOperationGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "bulkOperationId": "3525975375944"
  }'
*/
