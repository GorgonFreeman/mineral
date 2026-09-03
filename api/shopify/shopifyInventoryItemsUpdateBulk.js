// https://shopify.dev/docs/api/admin-graphql/latest/mutations/inventoryitemupdate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyBulkMutationDo } = require('./shopifyBulkMutationDo');

const inventoryItemsUpdateBulkMutation = `
  mutation call($id: ID!, $input: InventoryItemInput!) {
    inventoryItemUpdate(id: $id, input: $input) {
      inventoryItem {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['inventoryItemUpdates', Array.isArray],
]);

const shopifyInventoryItemsUpdateBulk = async (
  credsPayload,
  inventoryItemUpdates,
  {
    ...bulkMutationOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    inventoryItemUpdates,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyBulkMutationDo(
    credsPayload,
    {
      mutation: inventoryItemsUpdateBulkMutation,
      input: {
        data: inventoryItemUpdates.map(({ inventoryItemId, ...input }) => ({
          id: `gid://shopify/InventoryItem/${ inventoryItemId }`,
          input,
        })),
      },
    },
    bulkMutationOptions,
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyInventoryItemsUpdateBulk,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyInventoryItemsUpdateBulk" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "inventoryItemUpdates": [
      {
        "inventoryItemId": "43729076",
        "countryCodeOfOrigin": "US",
        "harmonizedSystemCode": "621710"
      }
    ]
  }'
*/
