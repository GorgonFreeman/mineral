// https://shopify.dev/docs/api/admin-graphql/latest/queries/locations

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyLocationsGet = async (
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

  return await shopifyGet(credsPayload, 'location', { ...getterOptions });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyLocationsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyLocationsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
