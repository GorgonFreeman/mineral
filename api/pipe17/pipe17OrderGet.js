// https://apidoc.pipe17.com/#/operations/fetchOrder

const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17GetSingle } = require('../pipe17/pipe17.utils');

const orderIdentifierValidator = (orderIdentifier) => {
  return objHasAny(orderIdentifier, ['orderId', 'extOrderId', 'extOrderApiId']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderIdentifier', orderIdentifierValidator],
]);

const resolveOrderId = ({
  orderId,
  extOrderId,
  extOrderApiId,
}) => {
  return orderId
    || (extOrderId ? `ext:${ extOrderId }` : null)
    || (extOrderApiId ? `api:${ extOrderApiId }` : null);
};

const pipe17OrderGet = async (
  credsPayload,
  orderIdentifier,
  {
    inspect = false,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return pipe17GetSingle(
    credsPayload,
    '/orders',
    resolveOrderId(orderIdentifier),
    {
      resultPath: 'result.order',
      inspect,
      fetchClient,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17OrderGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17OrderGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "orderIdentifier": { "orderId": "dc120f1015760357" }
  }'
*/
