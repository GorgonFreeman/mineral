// https://developers.gorgias.com/reference/get-customer

const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasGetSingle } = require('../gorgias/gorgiasGetSingle');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerId'],
]);

const gorgiasCustomerGetSingle = async (
  credsPayload,
  customerId,
  options = {},
) => {
  return gorgiasGetSingle(
    credsPayload,
    '/customers',
    customerId,
    options,
  );
};

const gorgiasCustomerGet = async (
  credsPayload,
  customerId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    customerId,
    gorgiasCustomerGetSingle,
    (customerIdItem) => ({
      args: [credsPayload, customerIdItem, options],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  gorgiasCustomerGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasCustomerGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" },
    "customerId": "123456789"
  }'
*/
