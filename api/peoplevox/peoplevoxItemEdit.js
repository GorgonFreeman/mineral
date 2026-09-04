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

const itemPayloadValidator = (itemPayload) => itemPayload?.ItemCode;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['itemPayload', (item) => everyIfArray(itemPayloadValidator, item)],
]);

const peoplevoxItemEditChunk = async (
  credsPayload,
  itemPayloads,
  {
    fetchClient = peoplevoxClient,
  } = {},
) => {

  const csvData = await json2csv(itemPayloads);

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

const peoplevoxItemEdit = async (
  credsPayload,
  itemPayload,
  {
    fetchClient = peoplevoxClient,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    itemPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const itemPayloads = ensureArray(itemPayload);

  // Sort into buckets of matching field sets so json2csv does not pad missing keys,
  // then chunk each bucket by max size
  const buckets = groupObjectsByFields(itemPayloads);
  const chunksByBucket = buckets.map((bucket) => arrayToChunks(bucket, MAX_REQUEST_ITEMS));
  const chunks = chunksByBucket.flat();

  return actionSingleOrMultiple(
    chunks,
    peoplevoxItemEditChunk,
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

Mixed field sets (grouped into separate SaveData calls):
curl -X POST "http://localhost:8000/peoplevoxItemEdit" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "peoplevox" },
    "itemPayload": [
      { "ItemCode": "100335-CHC-L", "Attribute9": "Whatever" },
      { "ItemCode": "100335-CHC-M", "Attribute9": "Watermelon", "Attribute10": "Werewolf" }
    ]
  }'
*/
