// https://developers.telnyx.com/api-reference/phone-numbers/list-available-phone-numbers

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const telnyxAvailablePhoneNumbersGet = async (
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
      url: '/available_phone_numbers',
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
  telnyxAvailablePhoneNumbersGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxAvailablePhoneNumbersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "options": {
      "params": {
        "filter[country_code]": "AU",
        "filter[features]": "sms"
      }
    }
  }'
*/
