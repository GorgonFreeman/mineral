// https://developers.telnyx.com/api-reference/messaging/list-messaging-profiles

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const telnyxMessagingProfilesGet = async (
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
      url: '/messaging_profiles',
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
  telnyxMessagingProfilesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxMessagingProfilesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" }
  }'
*/
