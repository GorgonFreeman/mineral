// https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobjects

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyGet } = require('./shopifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['type'],
]);

const shopifyMetaobjectsGet = async (
  credsPayload,
  type,
  {
    ...getterOptions // e.g. limit
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ 
    credsPayload,
    type,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return await shopifyGet(credsPayload, 'metaobject', { type, ...getterOptions });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMetaobjectsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetaobjectsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "type": "image_hotspot",
    "options": {
      "limit": 10
    }
  }'
*/
