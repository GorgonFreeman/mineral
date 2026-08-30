// https://developer.paypal.com/docs/api/payments/v2/#refunds_get

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['refundId'],
]);

const paypalRefundGet = async (
  credsPayload,
  refundId,
  {
    fetchClient = paypalClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    refundId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/v2/payments/refunds/${ encodeURIComponent(refundId) }`,
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
  paypalRefundGet,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalRefundGet" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal" },
      "refundId": "1JU08902781691411"
    }'
*/
