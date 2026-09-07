// https://apidoc.pipe17.com/#/operations/fetchPurchase

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17GetSingle } = require('../pipe17/pipe17.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['purchaseId'],
]);

const pipe17PurchaseGet = async (
  credsPayload,
  purchaseId,
  {
    inspect = false,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    purchaseId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return pipe17GetSingle(
    credsPayload,
    '/purchases',
    purchaseId,
    {
      resultPath: 'purchase',
      inspect,
      fetchClient,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17PurchaseGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17PurchaseGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "purchaseId": "075e2df5318aa93e"
  }'
*/
