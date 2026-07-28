const fs = require('fs').promises;
const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAny } = require('../utils');

const bulkMutationInputValidator = input => objHasAny(input, [
  'data', 
  'filepath', 
  'stagedUrl',
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
    option,
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

  const {
    data,
    filepath,
    stagedUrl,
  } = input;

  if (!stagedUrl) {
    if (!filepath) {
      // Make data into a file
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
