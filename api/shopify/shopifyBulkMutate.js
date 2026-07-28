const { randomUUID } = require('crypto');
const { createReadStream } = require('fs');
const fs = require('fs').promises;

const { HOSTED, TEMP_DIR } = require('../constants');
const { credsValidator } = require('../validators');
const {
  ArgsWarden,
  customFetch,
  objectToFormData,
  objHasAny,
  objectArrayToJsonl,
} = require('../utils');
const { shopifyStagedUploadCreate } = require('./shopifyStagedUploadCreate');
const { shopifyBulkOperationRunMutation } = require('./shopifyBulkOperationRunMutation');

const bulkMutationInputValidator = input => objHasAny(input, [
  'data', 
  'filepath', 
]);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['mutation'],
  ['input', bulkMutationInputValidator],
]);

const shopifyBulkMutate = async (
  credsPayload,
  mutation,
  input,
  {
    apiVersion,
    clientIdentifier,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ 
    credsPayload, 
    mutation, 
    input,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

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
    filepath = `${ TEMP_DIR }/shopifyBulkMutate_${ randomUUID() }.jsonl`;
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
    },
  );

  if (!mutationRunResponse.ok) {
    return mutationRunResponse;
  }

  return mutationRunResponse;

  // Optionally, poll for completion
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyBulkMutate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyBulkMutate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "arg": "1234"
  }'
*/
