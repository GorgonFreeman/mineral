const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { peoplevoxGetSingle } = require('../peoplevox/peoplevoxGetSingle');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['salesOrderNumber'],
]);

const peoplevoxOrderGet = async (
  credsPayload,
  salesOrderNumber,
  options = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    salesOrderNumber,
  });
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
    options,
  );
};

const funcApiConfig = {
  argsWarden,
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
