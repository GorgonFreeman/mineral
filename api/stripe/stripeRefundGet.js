// https://docs.stripe.com/api/refunds/retrieve

const { credsFromPayload, ArgsWarden } = require('../utils');
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

  const creds = await credsFromPayload(credsPayload);

  const response = await stripeClient.fetch({
    url: `/refunds/${ refundId }`,
    method: 'get',
    context: { creds },
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
