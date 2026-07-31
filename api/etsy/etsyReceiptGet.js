const { credsValidator } = require('./validators');
const { ArgsWarden } = require('./utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['receiptId'],
]);

const etsyReceiptGet = async (
  credsPayload,
  receiptId,
  options = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ 
    credsPayload, 
    receiptId, 
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return {
    ok: true,
    data: {
      receiptId,
      options,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyReceiptGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyReceiptGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "etsy" },
    "receiptId": "1234"
  }'
*/
