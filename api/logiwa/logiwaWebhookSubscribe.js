// https://myapi.logiwa.com/swagger/index.html#/Webhook/post_v3_1_Webhook_create

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['topic'],
  ['url'],
]);

const logiwaWebhookSubscribe = async (
  credsPayload,
  topic,
  url,
  {
    apiVersion,
    clientIdentifier,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    topic,
    url,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return logiwaClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/Webhook/create',
      body: {
        topic,
        address: url,
        ...(clientIdentifier ? { clientIdentifier } : { ignoreClient: true }),
      },
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
  logiwaWebhookSubscribe,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaWebhookSubscribe" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "topic": "wms/inventory/available",
    "url": "https://example.com/webhook"
  }'
*/
