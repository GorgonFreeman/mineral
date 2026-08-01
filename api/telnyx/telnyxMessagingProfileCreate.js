// https://developers.telnyx.com/api-reference/messaging/create-a-messaging-profile

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const profileValidator = (profile) => {
  return profile && typeof profile === 'object' && Object.keys(profile).length > 0;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['profile', profileValidator],
]);

const telnyxMessagingProfileCreate = async (
  credsPayload,
  profile,
  {
    inspect = false,
    fetchClient = telnyxClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    profile,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/messaging_profiles',
      body: profile,
    },
    context: { credsPayload },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  telnyxMessagingProfileCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxMessagingProfileCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "profile": {
      "name": "Mineral test profile"
    }
  }'
*/
