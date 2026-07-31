// https://shopify.dev/docs/api/admin-graphql/latest/queries/checkoutAndAccountsConfigurations

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet, shopifyGetter } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyCheckoutAndAccountsConfigurationsGet = async (
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
    'checkoutAndAccountsConfiguration', 
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
  shopifyCheckoutAndAccountsConfigurationsGet: (...args) => shopifyCheckoutAndAccountsConfigurationsGet(false, ...args),
  shopifyCheckoutAndAccountsConfigurationsGetter: (...args) => shopifyCheckoutAndAccountsConfigurationsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCheckoutAndAccountsConfigurationsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
