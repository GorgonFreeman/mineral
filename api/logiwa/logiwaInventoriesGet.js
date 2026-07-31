// https://myapi.logiwa.com/swagger/index.html#/Inventory/get_v3_1_Inventory_list_i__index__s__size_

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const logiwaInventoriesGet = async (
  credsPayload,
  {
    apiVersion,
    page = 0,
    perPage = MAX_PER_PAGE,
    sku_eq,
    clientIdentifier_eq,
    warehouseIdentifier_eq,
    inventoryStatusId_eq,
    location_eq,
    useSnapshotData_eq,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const params = {
    ...(sku_eq && { 'Sku.eq': sku_eq }),
    ...(clientIdentifier_eq && { 'ClientIdentifier.eq': clientIdentifier_eq }),
    ...(warehouseIdentifier_eq && { 'WarehouseIdentifier.eq': warehouseIdentifier_eq }),
    ...(inventoryStatusId_eq && { 'InventoryStatusId.eq': inventoryStatusId_eq }),
    ...(location_eq && { 'Location.eq': location_eq }),
    ...(useSnapshotData_eq && { 'UseSnapshotData.eq': useSnapshotData_eq }),
  };

  return logiwaClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/Inventory/list/i/${ page }/s/${ perPage }`,
      params,
    },
    context: {
      credsPayload,
      apiVersion,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  logiwaInventoriesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaInventoriesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" }
  }'
*/
