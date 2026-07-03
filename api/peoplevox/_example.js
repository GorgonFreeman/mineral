const { credsValidator } = require('../validators');
const { responseIfRejectingArgs, logDeep } = require('../utils');
const { peoplevoxGetSingle } = require('../peoplevox/peoplevoxGetSingle');

const validatorsByArg = {
  credsPayload: credsValidator,
  salesOrderNumber: Boolean,
};

const FUNC = async (
  credsPayload,
  salesOrderNumber,
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, salesOrderNumber });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await peoplevoxGetSingle(
    credsPayload,
    'Sales orders',
    {
      id: salesOrderNumber,
      idName: 'SalesOrderNumber',
    },
  );

  logDeep('response', response);
  return response;
};

const funcApiConfig = {
  argNames: ['credsPayload', 'salesOrderNumber'],
  validatorsByArg,
};

module.exports = {
  FUNC,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/FUNC" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "peoplevox" },
    "salesOrderNumber": "5977690603592"
  }'
*/
