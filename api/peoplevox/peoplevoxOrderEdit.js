const { json2csv } = require('json-2-csv');
const { credsValidator } = require('../validators');
const {
  ensureArray,
  everyIfArray,
  ArgsWarden,
  arrayToChunks,
  groupObjectsByFields,
  actionSingleOrMultiple,
} = require('../utils');
const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');
const { MAX_REQUEST_ITEMS } = require('../peoplevox/peoplevox.constants');

const orderPayloadValidator = (orderPayload) => orderPayload?.SalesOrderNumber;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderPayload', (i) => everyIfArray(orderPayloadValidator, i)],
]);

const peoplevoxOrderEditChunk = async (
  credsPayload,
  orderPayloads,
  {
    fetchClient = peoplevoxClient,
  } = {},
) => {

  const csvData = await json2csv(orderPayloads);

  return fetchClient.fetch({
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

const peoplevoxOrderEdit = async (
  credsPayload,
  orderPayload,
  {
    fetchClient = peoplevoxClient,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  // TODO: Consider making CSV transformation a request preparer step
  const orderPayloads = ensureArray(orderPayload);

  // Sort into buckets of matching field sets so json2csv does not pad missing keys,
  // then chunk each bucket by max size
  const buckets = groupObjectsByFields(orderPayloads);
  const chunksByBucket = buckets.map((bucket) => arrayToChunks(bucket, MAX_REQUEST_ITEMS));
  const chunks = chunksByBucket.flat();

  return actionSingleOrMultiple(
    chunks,
    peoplevoxOrderEditChunk,
    (chunk) => ({
      args: [credsPayload, chunk, { fetchClient }],
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
