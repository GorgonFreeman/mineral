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
    || (extFulfillmentId ? `ext:${ extFulfillmentId }` : null);
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
      resultPath: 'result.fulfillment',
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
    "fulfillmentIdentifier": { "fulfillmentId": "4ce308990d48d54f" }
  }'
*/
