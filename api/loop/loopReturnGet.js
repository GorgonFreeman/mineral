// https://docs.loopreturns.com/api-reference/latest/return-data/get-return-details

const { objHasAny, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { loopClient } = require('../loop/loop.utils');

const returnIdentifierValidator = (returnIdentifier) => {
  return objHasAny(returnIdentifier, [
    'returnId',
    'orderId',
    'orderName',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['returnIdentifier', returnIdentifierValidator],
]);

const loopReturnGet = async (
  credsPayload,
  returnIdentifier,
  options = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    returnIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    returnId,
    orderId,
    orderName,
  } = returnIdentifier;

  const params = {
    ...returnId && { return_id: returnId },
    ...orderId && { order_id: orderId },
    ...orderName && { order_name: orderName },
  };

  return loopClient.fetch({
    requestPayload: {
      url: '/warehouse/return/details',
      params,
    },
    context: {
      credsPayload,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  loopReturnGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/loopReturnGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "loop.au" },
    "returnIdentifier": { "returnId": "85747906" }
  }'
*/
