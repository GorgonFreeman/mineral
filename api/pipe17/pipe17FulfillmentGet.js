// https://apidoc.pipe17.com/#/operations/fetchFulfillment

const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17GetSingle } = require('../pipe17/pipe17.utils');

const fulfillmentIdentifierValidator = (fulfillmentIdentifier) => {
  return objHasAny(fulfillmentIdentifier, ['fulfillmentId', 'extFulfillmentId']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fulfillmentIdentifier', fulfillmentIdentifierValidator],
]);

const resolveFulfillmentId = ({
  fulfillmentId,
  extFulfillmentId,
}) => {
  return fulfillmentId
    || (extFulfillmentId ? `ext:${ encodeURIComponent(extFulfillmentId) }` : null);
};

const pipe17FulfillmentGet = async (
  credsPayload,
  fulfillmentIdentifier,
  {
    inspect = false,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fulfillmentIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return pipe17GetSingle(
    credsPayload,
    '/fulfillments',
    resolveFulfillmentId(fulfillmentIdentifier),
    {
      resultPath: 'fulfillment',
      inspect,
      fetchClient,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17FulfillmentGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17FulfillmentGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "fulfillmentIdentifier": { "fulfillmentId": "171889ac4c86b805" }
  }'

curl -X POST "http://localhost:8000/pipe17FulfillmentGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "fulfillmentIdentifier": { "extFulfillmentId": "bb558b1527b95c99:1Z179A841391432104" }
  }'
*/
