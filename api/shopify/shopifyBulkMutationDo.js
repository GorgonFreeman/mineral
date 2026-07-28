const { randomUUID } = require('crypto');
const { createReadStream } = require('fs');
const fs = require('fs').promises;

const { HOSTED, TEMP_DIR } = require('../constants');
const { credsValidator } = require('../validators');
const {
  ArgsWarden,
  customFetch,
  gidToId,
  objectToFormData,
  objHasAny,
  objectArrayToJsonl,
  jsonlToObjectArray,
  wait,
  valueProvided,
} = require('../utils');
const { shopifyStagedUploadCreate } = require('./shopifyStagedUploadCreate');
const { shopifyBulkOperationRunMutation } = require('./shopifyBulkOperationRunMutation');
const { shopifyBulkOperationGet } = require('./shopifyBulkOperationGet');

const bulkOpAttrs = `
  id
  status
  type
  objectCount
  url
  errorCode
`;

const createOrResumeBulkOpPayloadValidator = input => {
  const { mutation, input, bulkOperationId } = input;
  return (
    valueProvided(mutation) && objHasAny(input, [
      'mutationArgs',
      'bulkOperationId',
    ]) || valueProvided(bulkOperationId)
  );
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['createOrResumeBulkOpPayload', createOrResumeBulkOpPayloadValidator],
]);

const shopifyBulkMutationDo = async (
  credsPayload,
  createOrResumeBulkOpPayload,
  {
    apiVersion,
    clientIdentifier,
    waitForResult = true,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ 
    credsPayload, 
    createOrResumeBulkOpPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    mutation,
    input,
    bulkOperationId,
  } = createOrResumeBulkOpPayload;
  
  let bulkOperation;

  if (!bulkOperationId) {

    if (HOSTED) {
      return {
        ok: false,
        error: 'This function is only available locally',
      };
    }

    let {
      data,
      filepath,
    } = input;

    if (!filepath) {
      await fs.mkdir(TEMP_DIR, { recursive: true });
      filepath = `${ TEMP_DIR }/shopifyBulkMutationDo_${ randomUUID() }.jsonl`;
      await fs.writeFile(filepath, objectArrayToJsonl(data));
    }

    const stagedUploadResponse = await shopifyStagedUploadCreate(
      credsPayload,
      {
        resource: 'BULK_MUTATION_VARIABLES',
        filename: filepath.split('/').pop(),
        mimeType: 'text/jsonl',
        httpMethod: 'POST',
      },
      { apiVersion },
    );
    if (!stagedUploadResponse.ok) {
      return stagedUploadResponse;
    }

    const { url, parameters } = stagedUploadResponse.data.stagedTargets[0];

    const formData = objectToFormData(
      Object.fromEntries(parameters.map(({ name, value }) => [name, value])),
    );
    formData.append('file', createReadStream(filepath));

    const uploadResponse = await customFetch(url, {
      method: 'post',
      body: formData,
    });
    if (!uploadResponse.ok) {
      return uploadResponse;
    }

    const stagedUploadPath = uploadResponse.data?.PostResponse?.Key;
    
    const mutationRunResponse = await shopifyBulkOperationRunMutation(
      credsPayload,
      mutation,
      stagedUploadPath,
      {
        apiVersion,
        clientIdentifier,
        returnAttrs: bulkOpAttrs,
      },
    );

    if (!waitForResult) {
      return mutationRunResponse;
    }

    const { ok: mutationRunOk, data: mutationRunData } = mutationRunResponse;
    if (!mutationRunOk) {
      return mutationRunResponse;
    }
    
    bulkOperation = mutationRunData.bulkOperation;
    bulkOperationId = gidToId(bulkOperation.id);
  }
  
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

  const resultsResponse = await customFetch(bulkOperation.url);
  if (!resultsResponse.ok) {
    return resultsResponse;
  }

  const results = jsonlToObjectArray(resultsResponse.data);

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
  shopifyBulkMutationDo,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyBulkMutationDo" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "arg": "1234"
  }'
*/
