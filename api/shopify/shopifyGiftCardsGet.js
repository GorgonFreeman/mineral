// https://shopify.dev/docs/api/admin-graphql/latest/queries/giftCards

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet, shopifyGetter } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyGiftCardsGet = async (
  returnGetter, // Always bound

  credsPayload,
  {
    ...getterOptions // e.g. limit
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload, 
    'giftCard', 
    {
      ...getterOptions,
    },
  ];

  return returnGetter
    ? shopifyGetter(...getterArgs)
    : shopifyGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyGiftCardsGet: (...args) => shopifyGiftCardsGet(false, ...args),
  shopifyGiftCardsGetter: (...args) => shopifyGiftCardsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyGiftCardsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
