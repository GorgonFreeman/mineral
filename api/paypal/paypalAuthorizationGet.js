// https://developer.paypal.com/docs/api/payments/v2/#authorizations_get

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['authorizationId'],
]);

const paypalAuthorizationGet = async (
  credsPayload,
  authorizationId,
  {
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

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/v2/payments/authorizations/${ encodeURIComponent(authorizationId) }`,
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
  paypalAuthorizationGet,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalAuthorizationGet" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal" },
      "authorizationId": "0VF52814937998046"
    }'
*/
