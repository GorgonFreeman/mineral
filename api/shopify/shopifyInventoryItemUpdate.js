// https://shopify.dev/docs/api/admin-graphql/latest/mutations/inventoryitemupdate

const { credsValidator } = require('../validators');
const {
  actionSingleOrMultiple,
  everyIfArray,
  ArgsWarden,
  valueProvided,
} = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const inventoryItemUpdatePayloadValidator = (updatePayload) => {
  return valueProvided(updatePayload)
    && typeof updatePayload === 'object'
    && !Array.isArray(updatePayload);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['inventoryItemId', (id) => everyIfArray(valueProvided, id)],
  ['updatePayload', (payload) => everyIfArray(inventoryItemUpdatePayloadValidator, payload)],
]);

const defaultReturnInventoryItemAttrs = 'id countryCodeOfOrigin harmonizedSystemCode';

const shopifyInventoryItemUpdateSingle = async (
  credsPayload,
  inventoryItemId,
  updatePayload,
  {
    apiVersion,
    returnInventoryItemAttrs = defaultReturnInventoryItemAttrs,
  } = {},
) => {

  return shopifyMutationDo(
    credsPayload,
    'inventoryItemUpdate',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: `gid://shopify/InventoryItem/${ inventoryItemId }`,
        },
        input: {
          type: 'InventoryItemInput!',
          value: updatePayload,
        },
      },
      returnSchema: `inventoryItem { ${ returnInventoryItemAttrs } }`,
      apiVersion,
    },
  );
};

const shopifyInventoryItemUpdate = async (
  credsPayload,
  inventoryItemId,
  updatePayload,
  {
    queueRunOptions,
    apiVersion,
    returnInventoryItemAttrs = defaultReturnInventoryItemAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    inventoryItemId,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    [inventoryItemId, updatePayload],
    shopifyInventoryItemUpdateSingle,
    (inventoryItemIdItem, updatePayloadItem) => ({
      args: [
        credsPayload,
        inventoryItemIdItem,
        updatePayloadItem,
        {
          apiVersion,
          returnInventoryItemAttrs,
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
  shopifyInventoryItemUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyInventoryItemUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "inventoryItemId": "43729076",
    "updatePayload": {
      "countryCodeOfOrigin": "US",
      "harmonizedSystemCode": "621710"
    }
  }'
*/
