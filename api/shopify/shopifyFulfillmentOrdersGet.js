// https://shopify.dev/docs/api/admin-graphql/latest/queries/fulfillment-orders

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet, shopifyGetter } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyFulfillmentOrdersGet = async (
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
    'fulfillmentOrder', 
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
  shopifyFulfillmentOrdersGet: (...args) => shopifyFulfillmentOrdersGet(false, ...args),
  shopifyFulfillmentOrdersGetter: (...args) => shopifyFulfillmentOrdersGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyFulfillmentOrdersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
