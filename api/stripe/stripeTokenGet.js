// https://docs.stripe.com/api/tokens/retrieve

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stripeClient } = require('../stripe/stripe.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['tokenId'],
]);

const stripeTokenGet = async (
  credsPayload,
  tokenId,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    tokenId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await stripeClient.fetch({
    requestPayload: {
      url: `/tokens/${ tokenId }`,
    },
    context: { credsPayload },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  stripeTokenGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stripeTokenGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stripe" },
    "tokenId": "tok_123"
  }'
*/
