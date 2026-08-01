// https://apidoc.pipe17.com/#/operations/fetchReceipts

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const pipe17ReceiptsGet = async (
  credsPayload,
  {
    params,
    inspect = false,
    fetchClient = pipe17Client,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/receipts',
      params,
    },
    context: { credsPayload },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17ReceiptsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17ReceiptsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "options": { "params": { "count": 5 } }
  }'
*/
