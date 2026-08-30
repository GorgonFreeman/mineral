// https://developer.paypal.com/docs/api/orders/v2/#orders_get

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderId'],
]);

const paypalOrderGet = async (
  credsPayload,
  orderId,
  {
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

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/v2/checkout/orders/${ encodeURIComponent(orderId) }`,
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
  paypalOrderGet,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalOrderGet" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal" },
      "orderId": "5O190127TN364715T"
    }'
*/
