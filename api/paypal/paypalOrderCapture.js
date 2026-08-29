// https://developer.paypal.com/docs/api/orders/v2/#orders_capture

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderId'],
]);

const paypalOrderCapture = async (
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
      url: `/v2/checkout/orders/${ encodeURIComponent(orderId) }/capture`,
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
  paypalOrderCapture,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalOrderCapture" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal.personal" },
      "orderId": "5O190127TN364715T"
    }'
*/
