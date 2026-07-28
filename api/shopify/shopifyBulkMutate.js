const { randomUUID } = require('crypto');
const fs = require('fs').promises;

const { HOSTED, TEMP_DIR } = require('../constants');
const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAny, objectArrayToJsonl } = require('../utils');

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
    // Upload file to staged url
  }

  // Mutate using staged url

  // Optionally, poll for completion

  return {
    ok: true,
    data: {
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
