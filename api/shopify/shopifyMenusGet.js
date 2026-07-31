// https://shopify.dev/docs/api/admin-graphql/latest/queries/menus

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyMenusGet = async (
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

  return await shopifyGet(credsPayload, 'menu', { ...getterOptions });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMenusGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMenusGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
