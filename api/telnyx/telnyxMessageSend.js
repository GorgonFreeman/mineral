// https://developers.telnyx.com/api-reference/messages/send-a-message

const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const messageValidator = (message) => {
  return objHasAny(message, ['from', 'to', 'text']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['message', messageValidator],
]);

const telnyxMessageSend = async (
  credsPayload,
  message,
  {
    inspect = false,
    fetchClient = telnyxClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    message,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/messages',
      body: message,
    },
    context: { credsPayload },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  telnyxMessageSend,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxMessageSend" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "message": {
      "from": "+15551234567",
      "to": "+15559876543",
      "text": "Hello from Mineral",
      "messaging_profile_id": "00000000-0000-0000-0000-000000000000"
    }
  }'
*/
