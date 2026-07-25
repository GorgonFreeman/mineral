// https://myapi.logiwa.com/swagger/index.html#/Webhook/get_v3_1_Webhook_status__identifier_

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['subscriptionId'],
]);

const logiwaWebhookStatusGet = async (
  credsPayload,
  subscriptionId,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    subscriptionId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return logiwaClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/Webhook/status/${ subscriptionId }`,
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
  logiwaWebhookStatusGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaWebhookStatusGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "subscriptionId": "68706c98-0198-4671-9a97-4b3e3e59a56d"
  }'
*/
