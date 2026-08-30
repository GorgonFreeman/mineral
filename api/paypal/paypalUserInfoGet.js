// https://developer.paypal.com/docs/api/identity/v1/#userinfo_get

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

/**
 * Show OpenID Connect user profile details for the token subject.
 * Client-credentials tokens may return limited claims; user-consent
 * tokens with openid scopes return the full profile.
 */
const paypalUserInfoGet = async (
  credsPayload,
  {
    schema = 'openid',
    fetchClient = paypalClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/v1/identity/openidconnect/userinfo',
      params: {
        schema,
      },
    },
    context: {
      credsPayload,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  paypalUserInfoGet,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalUserInfoGet" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal" }
    }'
*/
