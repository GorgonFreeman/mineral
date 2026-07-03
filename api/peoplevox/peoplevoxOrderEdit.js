const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');

const orderPayloadValidator = (orderPayload) => {
  return orderPayload?.SalesOrderNumber;
};

const validatorsByArg = {
  credsPayload: credsValidator,
  orderPayload: orderPayloadValidator,
};

const peoplevoxOrderEdit = async (
  credsPayload,
  orderPayload,
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, orderPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  return peoplevoxClient.fetch({
    method: 'post',
    body: {
      saveRequest: {
        TemplateName: 'Sales orders',
        CsvData: orderPayload,
      },
    },
    context: {
      credsPayload,
      action: 'SaveData',
    },
  });
};

const funcApiConfig = {
  argNames: ['credsPayload', 'orderPayload'],
  validatorsByArg,
};

module.exports = {
  peoplevoxOrderEdit,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/peoplevoxOrderEdit" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "peoplevox" },
    "orderPayload": { "SalesOrderNumber": "7696610951240", "Attribute1": "Whatever" }
  }'
*/
