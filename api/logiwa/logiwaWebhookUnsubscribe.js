// https://myapi.logiwa.com/swagger/index.html#/Webhook/delete_v3_1_Webhook_unsubscribe__subscriptionIdentifier_

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['subscriptionId'],
]);

const logiwaWebhookUnsubscribe = async (
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
      method: 'delete',
      url: `/Webhook/unsubscribe/${ subscriptionId }`,
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
  logiwaWebhookUnsubscribe,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaWebhookUnsubscribe" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "subscriptionId": "68706c98-0198-4671-9a97-4b3e3e59a56d"
  }'
*/
