const { credsValidator } = require('../validators');
const {
  ArgsWarden,
  customFetch,
  gidToId,
  wait,
} = require('../utils');
const { parseShopifyJsonl } = require('./shopify.utils');
const { shopifyBulkOperationGet } = require('./shopifyBulkOperationGet');
const { shopifyBulkOperationRunQuery } = require('./shopifyBulkOperationRunQuery');

const bulkOpAttrs = `
  id
  status
  type
  objectCount
  url
  errorCode
`;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
]);

const shopifyBulkQueryDo = async (
  credsPayload,
  query,
  {
    apiVersion,
    waitForResult = true,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const queryRunResponse = await shopifyBulkOperationRunQuery(
    credsPayload,
    query,
    {
      apiVersion,
      returnAttrs: bulkOpAttrs,
    },
  );

  if (!waitForResult) {
    return queryRunResponse;
  }

  if (!queryRunResponse.ok) {
    return queryRunResponse;
  }

  let bulkOperation = queryRunResponse.data.bulkOperation;
  let bulkOperationId = gidToId(bulkOperation.id);

  while (['CREATED', 'RUNNING'].includes(bulkOperation?.status)) {

    if (bulkOperation) {
      await wait(5000);
    }

    const operationResponse = await shopifyBulkOperationGet(
      credsPayload,
      bulkOperationId,
      {
        apiVersion,
        attrs: bulkOpAttrs,
      },
    );
    if (!operationResponse.ok) {
      return operationResponse;
    }

    bulkOperation = operationResponse.data;
  }

  if (bulkOperation.status !== 'COMPLETED') {
    return {
      ok: false,
      error: {
        code: 'BULK_OPERATION_FAILED',
        message: `Bulk operation failed with status ${ bulkOperation.status }`,
        details: bulkOperation,
      },
    };
  }

  const resultsResponse = await customFetch(bulkOperation.url, {
    responseParser: (response) => response.text(),
  });
  if (!resultsResponse.ok) {
    return resultsResponse;
  }

  const results = parseShopifyJsonl(resultsResponse.data);

  return {
    ok: true,
    data: results,
    meta: {
      bulkOperation,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyBulkQueryDo,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyBulkQueryDo" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "query": "{ products { edges { node { id title handle } } } }"
  }'
*/
