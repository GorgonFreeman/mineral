// https://developers.telnyx.com/api-reference/phone-numbers/retrieve-a-phone-number

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const idValidator = (id) => typeof id === 'string' && id.length > 0;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['phoneNumberId', idValidator],
]);

const telnyxPhoneNumberGet = async (
  credsPayload,
  phoneNumberId,
  {
    params,
    inspect = false,
    fetchClient = telnyxClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    phoneNumberId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/phone_numbers/${ phoneNumberId }`,
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
  telnyxPhoneNumberGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxPhoneNumberGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "phoneNumberId": "00000000-0000-0000-0000-000000000000"
  }'
*/
