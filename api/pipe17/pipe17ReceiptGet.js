// https://apidoc.pipe17.com/#/operations/fetchReceipt

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17GetSingle } = require('../pipe17/pipe17.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['receiptId'],
]);

const pipe17ReceiptGet = async (
  credsPayload,
  receiptId,
  {
    inspect = false,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    receiptId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return pipe17GetSingle(
    credsPayload,
    '/receipts',
    receiptId,
    {
      resultPath: 'result.receipt',
      inspect,
      fetchClient,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17ReceiptGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17ReceiptGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "receiptId": "b9d03991a844e340"
  }'
*/
