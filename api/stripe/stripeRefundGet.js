// https://docs.stripe.com/api/refunds/retrieve

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeClient } = require('../stripe/stripe.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['refundId'],
]);

const stripeRefundGet = async (
  credsPayload,
  refundId,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    refundId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await stripeClient.fetch({
    requestPayload: {
      url: `/refunds/${ refundId }`,
    },
    context: { credsPayload },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  stripeRefundGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stripeRefundGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stripe" },
    "refundId": "re_123"
  }'
*/
