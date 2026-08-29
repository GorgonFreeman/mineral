// https://developer.paypal.com/docs/api/orders/v2/#orders_create

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['order'],
]);

/**
 * Create a PayPal order.
 * `order` is the full Orders v2 create payload, e.g.:
 * {
 *   intent: 'CAPTURE',
 *   purchase_units: [{ amount: { currency_code: 'USD', value: '10.00' } }],
 * }
 */
const paypalOrderCreate = async (
  credsPayload,
  order,
  {
    prefer = 'return=representation',
    requestId,
    fetchClient = paypalClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    order,
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
      url: '/v2/checkout/orders',
      headers,
      body: order,
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
  paypalOrderCreate,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalOrderCreate" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal.personal" },
      "order": {
        "intent": "CAPTURE",
        "purchase_units": [{
          "amount": { "currency_code": "USD", "value": "10.00" }
        }]
      }
    }'
*/
