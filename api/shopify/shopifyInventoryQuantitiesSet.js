// https://shopify.dev/docs/api/admin-graphql/latest/mutations/inventorySetQuantities

const { credsValidator } = require('../validators');
const {
  ArgsWarden,
  arrayToChunks,
  actionSingleOrMultiple,
  objHasAll,
  valueProvided,
} = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');
const {
  MAX_INVENTORY_QUANTITIES_PER_SET,
  INVENTORY_TYPES,
  INVENTORY_REASONS,
} = require('../shopify/shopify.constants');

const inventoryQuantityInputValidator = (p) => {
  return objHasAll(p, ['inventoryItemId', 'locationId', 'quantity']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['inventoryType', p => INVENTORY_TYPES.includes(p)],
  ['quantities', p => Array.isArray(p) && p.length > 0 && p.every(inventoryQuantityInputValidator)],
  ['reason', p => INVENTORY_REASONS.includes(p)],
  ['idempotencyKey'],
]);

const shopifyInventoryQuantitiesSetChunk = async (
  credsPayload,
  inventoryType,
  quantities,
  reason,
  idempotencyKey,
  {
    apiVersion,
    inventoryAdjustmentGroupReturnAttrs = defaultInventoryAdjustmentGroupReturnAttrs,
    referenceDocumentUri,
  } = {},
) => {

  const quantitiesForInput = quantities.map(({
    inventoryItemId,
    locationId,
    quantity,
    changeFromQuantity = null,
  }) => ({
    inventoryItemId: `gid://shopify/InventoryItem/${ inventoryItemId }`,
    locationId: `gid://shopify/Location/${ locationId }`,
    quantity,
    changeFromQuantity,
  }));

  return shopifyMutationDo(
    credsPayload,
    'inventorySetQuantities',
    {
      mutationVariables: {
        input: {
          type: 'InventorySetQuantitiesInput!',
          value: {
            name: inventoryType,
            reason,
            quantities: quantitiesForInput,
            ...(valueProvided(referenceDocumentUri) && { referenceDocumentUri }),
          },
        },
      },
      returnSchema: `inventoryAdjustmentGroup { ${ inventoryAdjustmentGroupReturnAttrs } }`,
      apiVersion,
      idempotencyKey,
    },
  );
};

const shopifyInventoryQuantitiesSet = async (
  credsPayload,
  inventoryType,
  quantities,
  reason,
  idempotencyKey,
  {
    queueRunOptions,
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

  const chunks = arrayToChunks(quantities, MAX_INVENTORY_QUANTITIES_PER_SET);

  return actionSingleOrMultiple(
    chunks,
    shopifyInventoryQuantitiesSetChunk,
    (chunk) => ({
      args: [
        credsPayload,
        inventoryType,
        chunk,
        reason,
        chunks.length === 1 ? idempotencyKey : `${ idempotencyKey }:${ chunks.indexOf(chunk) }`,
        {
          apiVersion,
          inventoryAdjustmentGroupReturnAttrs,
          referenceDocumentUri,
        },
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
  shopifyInventoryQuantitiesSet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyInventoryQuantitiesSet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.wakanda" },
    "inventoryType": "on_hand",
    "quantities": [{
      "inventoryItemId": "1234567890",
      "locationId": "1234567890",
      "changeFromQuantity": 10,
      "quantity": 5
    }],
    "reason": "correction",
    "idempotencyKey": "..."
  }'
*/
