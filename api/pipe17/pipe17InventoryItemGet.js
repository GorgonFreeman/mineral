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
      resultPath: 'result.inventory',
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
curl -X POST "http://localhost:8000/pipe17InventoryItemGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "inventoryItemId": "904e7f5e7a03df4f"
  }'
*/
