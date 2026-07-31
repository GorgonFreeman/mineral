const { json2csv } = require('json-2-csv');
const { credsValidator } = require('../validators');
const { ensureArray, everyIfArray, ArgsWarden } = require('../utils');
const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');
const { MAX_REQUEST_ITEMS } = require('../peoplevox/peoplevox.constants');

const orderPayloadValidator = (orderPayload) => orderPayload?.SalesOrderNumber;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderPayload', (i) => everyIfArray(orderPayloadValidator, i)],
]);

const peoplevoxOrderEdit = async (
  credsPayload,
  orderPayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  // TODO: Consider making CSV transformation a request preparer step
  const csvData = await json2csv(ensureArray(orderPayload));
  
  // TODO: Handle by chunking
  // TODO: Chunk objects by common fields so that each call has a consistent schema - bedrock groupObjectsByFields
  if (csvData.length > MAX_REQUEST_ITEMS) {
    return {
      ok: false,
      error: {
        code: 'MAX_REQUEST_ITEMS_EXCEEDED',
        message: `Max request items exceeded. Max is ${ MAX_REQUEST_ITEMS }.`,
      },
    };
  }

  return peoplevoxClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        saveRequest: {
          TemplateName: 'Sales orders',
          CsvData: csvData,
        },
      },
    },
    context: {
      credsPayload,
      action: 'SaveData',
    },
  });
};

const funcApiConfig = {
  argsWarden,
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

Take order off hold:
curl -X POST "http://localhost:8000/peoplevoxOrderEdit" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "peoplevox" },
    "orderPayload": {
      "SalesOrderNumber": "7696610951240",
      "OnHold": false,
      "StopShip": false
    }
  }'
*/
