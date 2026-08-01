// https://developers.telnyx.com/api-reference/messaging/retrieve-a-messaging-profile

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const idValidator = (id) => typeof id === 'string' && id.length > 0;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['messagingProfileId', idValidator],
]);

const telnyxMessagingProfileGet = async (
  credsPayload,
  messagingProfileId,
  {
    params,
    inspect = false,
    fetchClient = telnyxClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    messagingProfileId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/messaging_profiles/${ messagingProfileId }`,
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
  telnyxMessagingProfileGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxMessagingProfileGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "messagingProfileId": "00000000-0000-0000-0000-000000000000"
  }'
*/
