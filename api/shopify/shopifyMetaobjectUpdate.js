// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectUpdate

const { credsValidator } = require('../validators');
const { actionSingleOrMultiple, everyIfArray, ArgsWarden, valueProvided } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const updatePayloadValidator = (updatePayload) => valueProvided(updatePayload)
  && typeof updatePayload === 'object';

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['metaobjectId', (i) => everyIfArray(valueProvided, i)],
  ['updatePayload', (i) => everyIfArray(updatePayloadValidator, i)],
]);

const defaultReturnMetaobjectAttrs = 'id handle type updatedAt capabilities { publishable { status } }';

const shopifyMetaobjectUpdateSingle = async (
  credsPayload,
  metaobjectId,
  updatePayload,
  {
    apiVersion,
    returnMetaobjectAttrs = defaultReturnMetaobjectAttrs,
  } = {},
) => {

  return shopifyMutationDo(
    credsPayload,
    'metaobjectUpdate',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: `gid://shopify/Metaobject/${ metaobjectId }`,
        },
        metaobject: {
          type: 'MetaobjectUpdateInput!',
          value: updatePayload,
        },
      },
      returnSchema: `metaobject { ${ returnMetaobjectAttrs } }`,
      apiVersion,
    },
  );
};

const shopifyMetaobjectUpdate = async (
  credsPayload,
  metaobjectId,
  updatePayload,
  {
    queueRunOptions,
    apiVersion,
    returnMetaobjectAttrs = defaultReturnMetaobjectAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    metaobjectId,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    [metaobjectId, updatePayload],
    shopifyMetaobjectUpdateSingle,
    (metaobjectIdItem, updatePayloadItem) => ({
      args: [
        credsPayload,
        metaobjectIdItem,
        updatePayloadItem,
        { apiVersion, returnMetaobjectAttrs },
      ],
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
  shopifyMetaobjectUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetaobjectUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "metaobjectId": "207864102984",
    "updatePayload": {
      "capabilities": {
        "publishable": {
          "status": "ACTIVE"
        }
      }
    }
  }'
*/
