const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { peoplevoxGetSingle } = require('../peoplevox/peoplevoxGetSingle');

const validatorsByArg = {
  credsPayload: credsValidator,
  salesOrderNumber: Boolean,
};

const peoplevoxOrderGet = async (
  credsPayload,
  salesOrderNumber,
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, salesOrderNumber });
  if (rejectResponse) {
    return rejectResponse;
  }

  return peoplevoxGetSingle(
    credsPayload,
    'Sales orders',
    {
      id: salesOrderNumber,
      idName: 'SalesOrderNumber',
    },
  );
};

const funcApiConfig = {
  argNames: ['credsPayload', 'salesOrderNumber'],
  validatorsByArg,
};

module.exports = {
  peoplevoxOrderGet,
  funcApiConfig,
};

/*
curl localhost:8000/peoplevoxOrderGet \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsObject": {
        "CLIENT_ID": "kaibacorp",
        "USERNAME": "Seto",
        "PASSWORD": "8lu33y3z8e$t"
      }
    },
    "salesOrderNumber": "7680864157768"
  }'

curl -X POST "http://localhost:8000/peoplevoxOrderGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "peoplevox" },
    "salesOrderNumber": "7680864157768"
  }'
*/
