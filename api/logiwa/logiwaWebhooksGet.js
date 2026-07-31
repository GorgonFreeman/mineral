// https://myapi.logiwa.com/swagger/index.html#/Webhook/get_v3_1_Webhook_list

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const logiwaWebhooksGet = async (
  credsPayload,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return logiwaClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/Webhook/list',
    },
    context: {
      credsPayload,
      apiVersion,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  logiwaWebhooksGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaWebhooksGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" }
  }'
*/
