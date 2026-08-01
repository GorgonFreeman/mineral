// https://developers.telnyx.com/api-reference/messaging/update-a-messaging-profile

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const idValidator = (id) => typeof id === 'string' && id.length > 0;

const bodyValidator = (body) => {
  return body && typeof body === 'object' && Object.keys(body).length > 0;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['messagingProfileId', idValidator],
  ['body', bodyValidator],
]);

const telnyxMessagingProfileUpdate = async (
  credsPayload,
  messagingProfileId,
  body,
  {
    inspect = false,
    fetchClient = telnyxClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    messagingProfileId,
    body,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'patch',
      url: `/messaging_profiles/${ messagingProfileId }`,
      body,
    },
    context: { credsPayload },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  telnyxMessagingProfileUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxMessagingProfileUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "messagingProfileId": "00000000-0000-0000-0000-000000000000",
    "body": {
      "webhook_url": "https://example.com/telnyx/webhook"
    }
  }'
*/
