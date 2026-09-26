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
    // Resume an existing bulk query by numeric id (skips runQuery)
    bulkOperationId: resumeBulkOperationId,
    // Called with the numeric bulk operation id as soon as it is known (create path)
    onBulkOperationId,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  let bulkOperation;
  let bulkOperationId = resumeBulkOperationId;

  if (!bulkOperationId) {
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

    bulkOperation = queryRunResponse.data.bulkOperation;
    bulkOperationId = gidToId(bulkOperation.id);

    if (onBulkOperationId) {
      await onBulkOperationId(bulkOperationId);
    }
  }

  // Resume path starts with bulkOperation unset — fetch at least once before status checks.
  // Treat missing/empty status as still in flight (occasional empty digests while RUNNING).
  const isInFlight = (op) => !op?.status || ['CREATED', 'RUNNING'].includes(op.status);

  while (!bulkOperation || isInFlight(bulkOperation)) {

    if (bulkOperation) {
      await wait(5000);
    }

    let operationResponse;
    let pollAttempts = 0;
    while (pollAttempts < 5) {
      pollAttempts += 1;
      operationResponse = await shopifyBulkOperationGet(
        credsPayload,
        bulkOperationId,
        {
          apiVersion,
          attrs: bulkOpAttrs,
        },
      );
      if (operationResponse.ok && operationResponse.data?.status) {
        break;
      }
      await wait(5000);
    }

    if (!operationResponse?.ok) {
      return operationResponse;
    }

    if (!operationResponse.data?.status) {
      continue;
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

  const resultsResponse = await customFetch(bulkOperation.url);
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
