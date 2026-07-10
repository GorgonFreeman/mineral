// https://myapi.logiwa.com/swagger/index.html#/ShipmentOrder/get_v3_1_ShipmentOrder_list_i__index__s__size_

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const logiwaOrdersGet = async (
  credsPayload,
  {
    apiVersion,
    page = 0,
    perPage = MAX_PER_PAGE,
    sku_eq,
    updatedDateTime_bt,
    code_eq,
    warehouseIdentifier_eq,
    warehouseIdentifier_in,
    identifier_eq,
    clientIdentifier_eq,
    clientIdentifier_in,
    createdDateTime_bt,
    actualShipmentDate_bt,
    shipmentOrderDate_bt,
    status_in,
    status_eq,
    expectedShipmentDate_bt,
    shipmentOrderTypeName_eq,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const params = {
    ...(sku_eq && { 'Sku.eq': sku_eq }),
    ...(updatedDateTime_bt && { 'UpdatedDateTime.bt': updatedDateTime_bt }),
    ...(code_eq && { 'Code.eq': code_eq }),
    ...(warehouseIdentifier_eq && { 'WarehouseIdentifier.eq': warehouseIdentifier_eq }),
    ...(warehouseIdentifier_in && { 'WarehouseIdentifier.in': warehouseIdentifier_in }),
    ...(identifier_eq && { 'Identifier.eq': identifier_eq }),
    ...(clientIdentifier_eq && { 'ClientIdentifier.eq': clientIdentifier_eq }),
    ...(clientIdentifier_in && { 'ClientIdentifier.in': clientIdentifier_in }),
    ...(createdDateTime_bt && { 'CreatedDateTime.bt': createdDateTime_bt }),
    ...(actualShipmentDate_bt && { 'ActualShipmentDate.bt': actualShipmentDate_bt }),
    ...(shipmentOrderDate_bt && { 'ShipmentOrderDate.bt': shipmentOrderDate_bt }),
    ...(status_in && { 'Status.in': status_in }),
    ...(status_eq && { 'Status.eq': status_eq }),
    ...(expectedShipmentDate_bt && { 'ExpectedShipmentDate.bt': expectedShipmentDate_bt }),
    ...(shipmentOrderTypeName_eq && { 'ShipmentOrderTypeName.eq': shipmentOrderTypeName_eq }),
  };

  return logiwaClient.fetch({
    method: 'get',
    url: `/ShipmentOrder/list/i/${ page }/s/${ perPage }`,
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
  logiwaOrdersGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaOrdersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" }
  }'

curl -X POST "http://localhost:8000/logiwaOrdersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "options": { "code_eq": "#USA5674542" }
  }'
*/
