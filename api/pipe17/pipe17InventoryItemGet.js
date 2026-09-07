// https://apidoc.pipe17.com/#/operations/fetchInventory

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17GetSingle } = require('../pipe17/pipe17.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['inventoryItemId'],
]);

const pipe17InventoryItemGet = async (
  credsPayload,
  inventoryItemId,
  {
    inspect = false,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    inventoryItemId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return pipe17GetSingle(
    credsPayload,
    '/inventory',
    inventoryItemId,
    {
      resultPath: 'inventory',
      inspect,
      fetchClient,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17InventoryItemGet,
  funcApiConfig,
};

/*
NOTE: no working call found. Pipe17 inventory records carry no id of their own — they are
keyed by sku + locationId — and GET /inventory/{id} returns 404 "No results" for a sku or a
locationId. Fetch by sku through pipe17InventoryItemsGet instead (one row per location):

curl -X POST "http://localhost:8000/pipe17InventoryItemsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "options": { "params": { "sku": "EXDAL2449-5-XS" } }
  }'
*/
