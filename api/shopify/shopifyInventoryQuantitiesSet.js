// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageDelete

const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAll } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const inventoryQuantityInputValidator = (p) => {
  return objHasAll(p, ['inventoryItemId', 'locationId', 'quantity']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['inventoryType', p => ['available', 'on_hand'].includes(p)],
  ['quantities', p => p.every(inventoryQuantityInputValidator)],
  ['reason'], // TODO: Validate against list of possible reasons
  ['idempotencyKey'],
]);

const shopifyInventoryQuantitiesSet = async (
  credsPayload,
  inventoryType,
  quantities,
  reason,
  idempotencyKey,
  {
    apiVersion,
    inventoryAdjustmentGroupReturnAttrs = 'createdAt reason changes { name delta }',
    referenceDocumentUri,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    inventoryType,
    quantities,
    reason,
    idempotencyKey,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'thingDelete',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: `gid://shopify/Thing/${ thingId }`,
        },
      },
      returnSchema,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyInventoryQuantitiesSet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyInventoryQuantitiesSet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    ...
  }'
*/
