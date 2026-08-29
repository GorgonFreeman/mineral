// https://developer.paypal.com/docs/api/payments/v2/#authorizations_capture

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['authorizationId'],
]);

const paypalAuthorizationCapture = async (
  credsPayload,
  authorizationId,
  {
    capture,
    prefer = 'return=representation',
    requestId,
    fetchClient = paypalClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    authorizationId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const headers = {
    Prefer: prefer,
  };
  if (requestId) {
    headers['PayPal-Request-Id'] = requestId;
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/v2/payments/authorizations/${ encodeURIComponent(authorizationId) }/capture`,
      headers,
      body: capture !== undefined ? capture : {},
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
  paypalAuthorizationCapture,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalAuthorizationCapture" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal.personal" },
      "authorizationId": "0VF52814937998046",
      "options": {
        "capture": {
          "amount": { "value": "10.00", "currency_code": "USD" },
          "final_capture": true
        }
      }
    }'
*/
