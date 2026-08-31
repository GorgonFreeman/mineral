const { json2csv } = require('json-2-csv');
const { credsValidator } = require('../validators');
const { ensureArray, everyIfArray, ArgsWarden } = require('../utils');
const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');
const { MAX_REQUEST_ITEMS } = require('../peoplevox/peoplevox.constants');

const itemPayloadValidator = (itemPayload) => itemPayload?.ItemCode;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['itemPayload', (item) => everyIfArray(itemPayloadValidator, item)],
]);

const peoplevoxItemEdit = async (
  credsPayload,
  itemPayload,
  {
    fetchClient = peoplevoxClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    itemPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const csvData = await json2csv(ensureArray(itemPayload));

  if (csvData.length > MAX_REQUEST_ITEMS) {
    return {
      ok: false,
      error: {
        code: 'MAX_REQUEST_ITEMS_EXCEEDED',
        message: `Max request items exceeded. Max is ${ MAX_REQUEST_ITEMS }.`,
      },
    };
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        saveRequest: {
          TemplateName: 'Item types',
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
  peoplevoxItemEdit,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/peoplevoxItemEdit" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "peoplevox" },
    "itemPayload": {
      "ItemCode": "100335-CHC-L",
      "Attribute7": "ATTR7"
    }
  }'
*/
