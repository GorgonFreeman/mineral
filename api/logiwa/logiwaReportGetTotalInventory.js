// https://myapi.logiwa.com/swagger/index.html#/Report/get_v3_1_Report_TotalInventory_i__index__s__size_

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const logiwaReportGetTotalInventory = async (
  credsPayload,
  {
    apiVersion,
    page = 0,
    perPage = MAX_PER_PAGE,
    sku_eq,
    clientIdentifier_eq,
    clientIdentifier_in,
    outOfStock_eq,
    warehouseIdentifier_eq,
    warehouseIdentifier_in,
    productTypeName_eq,
    productGroupName_eq,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const params = {
    ...(sku_eq && { 'Sku.eq': sku_eq }),
    ...(clientIdentifier_eq && { 'ClientIdentifier.eq': clientIdentifier_eq }),
    ...(clientIdentifier_in && { 'ClientIdentifier.in': clientIdentifier_in }),
    ...(outOfStock_eq !== undefined && { 'OutOfStock.eq': outOfStock_eq }),
    ...(warehouseIdentifier_eq && { 'WarehouseIdentifier.eq': warehouseIdentifier_eq }),
    ...(warehouseIdentifier_in && { 'WarehouseIdentifier.in': warehouseIdentifier_in }),
    ...(productTypeName_eq && { 'ProductTypeName.eq': productTypeName_eq }),
    ...(productGroupName_eq && { 'ProductGroupName.eq': productGroupName_eq }),
  };

  return logiwaClient.fetch({
    method: 'get',
    url: `/Report/TotalInventory/i/${ page }/s/${ perPage }`,
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
  logiwaReportGetTotalInventory,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaReportGetTotalInventory" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "options": { "outOfStock_eq": true }
  }'
*/
