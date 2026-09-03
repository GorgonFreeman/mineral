// https://shopify.dev/docs/api/admin-graphql/latest/mutations/inventoryitemupdate

const { credsValidator } = require('../validators');
const {
  actionSingleOrMultiple,
  everyIfArray,
  ArgsWarden,
  valueProvided,
} = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const inventoryItemUpdateValidator = (inventoryItemUpdate) => {
  const {
    inventoryItemId,
    ...updatePayload
  } = inventoryItemUpdate;

  return valueProvided(inventoryItemId)
    && valueProvided(updatePayload)
    && typeof updatePayload === 'object'
    && !Array.isArray(updatePayload);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['inventoryItemUpdate', (p) => everyIfArray(inventoryItemUpdateValidator, p)],
]);

const defaultReturnInventoryItemAttrs = 'id countryCodeOfOrigin harmonizedSystemCode';

const shopifyInventoryItemUpdateSingle = async (
  credsPayload,
  inventoryItemUpdate,
  {
    apiVersion,
    returnInventoryItemAttrs = defaultReturnInventoryItemAttrs,
  } = {},
) => {

  const {
    inventoryItemId,
    ...updatePayload
  } = inventoryItemUpdate;

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
  inventoryItemUpdate, // update payload with inventoryItemId included
  {
    queueRunOptions,
    apiVersion,
    returnInventoryItemAttrs = defaultReturnInventoryItemAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    inventoryItemUpdate,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    [inventoryItemUpdate],
    shopifyInventoryItemUpdateSingle,
    (inventoryItemUpdateItem) => ({
      args: [
        credsPayload,
        inventoryItemUpdateItem,
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
    "inventoryItemUpdate": {
      "inventoryItemId": "43729076",
      "countryCodeOfOrigin": "US",
      "harmonizedSystemCode": "621710"
    }
  }'
*/
