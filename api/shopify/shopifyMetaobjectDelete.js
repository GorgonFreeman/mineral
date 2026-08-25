// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectDelete

const { credsValidator } = require('../validators');
const { actionSingleOrMultiple, ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['metaobjectId'],
]);

const shopifyMetaobjectDeleteSingle = async (
  credsPayload,
  metaobjectId,
  {
    apiVersion,
    returnSchema = 'deletedId',
  } = {},
) => {

  return shopifyMutationDo(
    credsPayload,
    'metaobjectDelete',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: `gid://shopify/Metaobject/${ metaobjectId }`,
        },
      },
      returnSchema,
      apiVersion,
    },
  );
};

const shopifyMetaobjectDelete = async (
  credsPayload,
  metaobjectId,
  {
    queueRunOptions,
    apiVersion,
    returnSchema = 'deletedId',
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
    shopifyMetaobjectDeleteSingle,
    (metaobjectIdItem) => ({
      args: [credsPayload, metaobjectIdItem, { apiVersion, returnSchema }],
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
  shopifyMetaobjectDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetaobjectDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "metaobjectId": "215094820924"
  }'

curl -X POST "http://localhost:8000/shopifyMetaobjectDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "metaobjectId": ["215094820924", "215094820925"]
  }'
*/
