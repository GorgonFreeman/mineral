// https://docs.stripe.com/api/tokens/retrieve

const { credsFromPayload, ArgsWarden } = require('../utils');
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

  const creds = await credsFromPayload(credsPayload);

  const response = await stripeClient.fetch({
    url: `/tokens/${ tokenId }`,
    context: { creds },
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
