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

const bulkMutationInputValidator = input => objHasAny(input, [
  'data', 
  'filepath', 
  'stagedUploadPath',
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

  let {
    data,
    filepath,
    stagedUploadPath,
  } = input;

  if (!stagedUploadPath) {

    if (HOSTED) {
      return {
        ok: false,
        error: 'File-based options are not available while hosted',
      };
    }

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

    stagedUploadPath = uploadResponse.data?.PostResponse?.Key;
  }

  // Mutate using staged upload path

  // Optionally, poll for completion

  return {
    ok: true,
    data: {
      stagedUploadPath,
      mutation,
      input,
    },
  };
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
