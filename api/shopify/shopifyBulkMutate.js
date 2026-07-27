const fs = require('fs').promises;
const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAny } = require('../utils');

const bulkMutationInputValidator = input => objHasAny(input, ['filepath', 'data', 'stagedUploadUrl']);

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
    filepath,
    data,
    stagedUploadUrl,
  } = input;

  if (filepath) {
    
    if (HOSTED) {
      return {
        ok: false,
        error: 'Filepath is not supported for hosted environments',
      };
    }

    const file = await fs.readFile(filepath, 'utf8');
  }

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
