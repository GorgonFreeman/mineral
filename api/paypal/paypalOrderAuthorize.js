// https://developer.paypal.com/docs/api/orders/v2/#orders_authorize

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderId'],
]);

const paypalOrderAuthorize = async (
  credsPayload,
  orderId,
  {
    body,
    prefer = 'return=representation',
    requestId,
    fetchClient = paypalClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderId,
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
      url: `/v2/checkout/orders/${ encodeURIComponent(orderId) }/authorize`,
      headers,
      ...(body !== undefined ? { body } : { body: {} }),
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
  paypalOrderAuthorize,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalOrderAuthorize" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal" },
      "orderId": "5O190127TN364715T"
    }'
*/
