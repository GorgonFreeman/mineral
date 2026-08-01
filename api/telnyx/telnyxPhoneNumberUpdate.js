// https://developers.telnyx.com/api-reference/phone-numbers/update-a-phone-number

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const idValidator = (id) => typeof id === 'string' && id.length > 0;

const bodyValidator = (body) => {
  return body && typeof body === 'object' && Object.keys(body).length > 0;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['phoneNumberId', idValidator],
  ['body', bodyValidator],
]);

const telnyxPhoneNumberUpdate = async (
  credsPayload,
  phoneNumberId,
  body,
  {
    inspect = false,
    fetchClient = telnyxClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    phoneNumberId,
    body,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'patch',
      url: `/phone_numbers/${ phoneNumberId }`,
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
  telnyxPhoneNumberUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxPhoneNumberUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "phoneNumberId": "00000000-0000-0000-0000-000000000000",
    "body": {
      "messaging_profile_id": "00000000-0000-0000-0000-000000000001"
    }
  }'
*/
