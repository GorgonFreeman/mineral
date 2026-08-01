// https://developers.telnyx.com/api-reference/number-lookup/lookup-number

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const phoneNumberValidator = (phoneNumber) => typeof phoneNumber === 'string' && phoneNumber.length > 0;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['phoneNumber', phoneNumberValidator],
]);

const telnyxNumberLookupGet = async (
  credsPayload,
  phoneNumber,
  {
    params,
    inspect = false,
    fetchClient = telnyxClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    phoneNumber,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const encodedPhoneNumber = encodeURIComponent(phoneNumber);

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/number_lookup/${ encodedPhoneNumber }`,
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
  telnyxNumberLookupGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxNumberLookupGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "phoneNumber": "+61412345678"
  }'
*/
