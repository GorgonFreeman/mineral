// https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobject

const { credsValidator } = require('../validators');
const { actionSingleOrMultiple, ArgsWarden } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = 'id handle type updatedAt capabilities { publishable { status } } fields { key value type }';

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['metaobjectId'],
]);

const shopifyMetaobjectGetSingle = async (
  credsPayload,
  metaobjectId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  return shopifyGetSingle(
    credsPayload,
    'metaobject',
    metaobjectId,
    {
      apiVersion,
      attrs,
    },
  );
};

const shopifyMetaobjectGet = async (
  credsPayload,
  metaobjectId,
  {
    queueRunOptions,
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    metaobjectId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    metaobjectId,
    shopifyMetaobjectGetSingle,
    (metaobjectIdItem) => ({
      args: [credsPayload, metaobjectIdItem, { apiVersion, attrs }],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMetaobjectGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetaobjectGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "metaobjectId": "207864102984"
  }'
*/
