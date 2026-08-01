// https://developers.telnyx.com/api-reference/webhooks/list-webhook-deliveries

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const telnyxWebhookDeliveriesGet = async (
  credsPayload,
  {
    params,
    inspect = false,
    fetchClient = telnyxClient,
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
      url: '/webhook_deliveries',
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
  telnyxWebhookDeliveriesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxWebhookDeliveriesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "options": {
      "params": {
        "filter[status][eq]": "failed"
      }
    }
  }'
*/
