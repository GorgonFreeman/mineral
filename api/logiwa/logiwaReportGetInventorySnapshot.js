// https://myapi.logiwa.com/swagger/index.html#/Report/get_v3_1_Report_InventorySnapshot_i__index__s__size_

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const logiwaReportGetInventorySnapshot = async (
  credsPayload,
  {
    apiVersion,
    page = 0,
    perPage = MAX_PER_PAGE,
    warehouseIdentifier_eq,
    clientIdentifier_eq,
    locationIdentifier_eq,
    sku_eq,
    snapshotDate_bt,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const params = {
    ...(warehouseIdentifier_eq && { 'WarehouseIdentifier.eq': warehouseIdentifier_eq }),
    ...(clientIdentifier_eq && { 'ClientIdentifier.eq': clientIdentifier_eq }),
    ...(locationIdentifier_eq && { 'LocationIdentifier.eq': locationIdentifier_eq }),
    ...(sku_eq && { 'Sku.eq': sku_eq }),
    ...(snapshotDate_bt && { 'SnapshotDate.bt': snapshotDate_bt }),
  };

  return logiwaClient.fetch({
    method: 'get',
    url: `/Report/InventorySnapshot/i/${ page }/s/${ perPage }`,
    params,
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
  logiwaReportGetInventorySnapshot,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaReportGetInventorySnapshot" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "options": { "clientIdentifier_eq": "9f1ea39a-fccc-48af-8986-a35c34fcef8b" }
  }'
*/
