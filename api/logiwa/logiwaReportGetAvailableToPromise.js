// https://myapi.logiwa.com/swagger/index.html#/Report/get_v3_1_Report_AvailableToPromise_i__index__s__size_

const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');
const { DEFAULT_API_VERSION, MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const isSet = (value) => {
  if (value === 0 || value === false || value === '') {
    return true;
  }

  return Boolean(value);
};

const logiwaReportGetAvailableToPromiseSingle = async (
  credsPayload,
  {
    apiVersion = DEFAULT_API_VERSION,
    page = 0,
    perPage = MAX_PER_PAGE,
    sku_eq,
    clientIdentifier_eq,
    clientIdentifier_in,
    warehouseIdentifier_eq,
    warehouseIdentifier_in,
    plannedAtpQuantity_eq,
    plannedAtpQuantity_gt,
    plannedAtpQuantity_lt,
    plannedAtpQuantity_gte,
    plannedAtpQuantity_lte,
    totalStockQuantity_eq,
    totalStockQuantity_gt,
    totalStockQuantity_lt,
    totalStockQuantity_gte,
    totalStockQuantity_lte,
    inventoryAtpQuantity_eq,
    inventoryAtpQuantity_gt,
    inventoryAtpQuantity_lt,
    inventoryAtpQuantity_gte,
    inventoryAtpQuantity_lte,
    undamagedQuantity_eq,
    undamagedQuantity_gt,
    undamagedQuantity_lt,
    undamagedQuantity_gte,
    undamagedQuantity_lte,
    currentAtpQuantity_eq,
    currentAtpQuantity_gt,
    currentAtpQuantity_lt,
    currentAtpQuantity_gte,
    currentAtpQuantity_lte,
  } = {},
) => {

  const params = {
    ...(sku_eq && { 'Sku.eq': sku_eq }),
    ...(clientIdentifier_eq && { 'ClientIdentifier.eq': clientIdentifier_eq }),
    ...(clientIdentifier_in && { 'ClientIdentifier.in': clientIdentifier_in }),
    ...(warehouseIdentifier_eq && { 'WarehouseIdentifier.eq': warehouseIdentifier_eq }),
    ...(warehouseIdentifier_in && { 'WarehouseIdentifier.in': warehouseIdentifier_in }),
    ...(isSet(plannedAtpQuantity_eq) && { 'PlannedATPQuantity.eq': plannedAtpQuantity_eq }),
    ...(isSet(plannedAtpQuantity_gt) && { 'PlannedATPQuantity.gt': plannedAtpQuantity_gt }),
    ...(isSet(plannedAtpQuantity_lt) && { 'PlannedATPQuantity.lt': plannedAtpQuantity_lt }),
    ...(isSet(plannedAtpQuantity_gte) && { 'PlannedATPQuantity.gte': plannedAtpQuantity_gte }),
    ...(isSet(plannedAtpQuantity_lte) && { 'PlannedATPQuantity.lte': plannedAtpQuantity_lte }),
    ...(apiVersion === 'v3.1' ? {
      ...(isSet(totalStockQuantity_eq) && { 'TotalStockQuantity.eq': totalStockQuantity_eq }),
      ...(isSet(totalStockQuantity_gt) && { 'TotalStockQuantity.gt': totalStockQuantity_gt }),
      ...(isSet(totalStockQuantity_lt) && { 'TotalStockQuantity.lt': totalStockQuantity_lt }),
      ...(isSet(totalStockQuantity_gte) && { 'TotalStockQuantity.gte': totalStockQuantity_gte }),
      ...(isSet(totalStockQuantity_lte) && { 'TotalStockQuantity.lte': totalStockQuantity_lte }),
      ...(isSet(inventoryAtpQuantity_eq) && { 'InventoryATPQuantity.eq': inventoryAtpQuantity_eq }),
      ...(isSet(inventoryAtpQuantity_gt) && { 'InventoryATPQuantity.gt': inventoryAtpQuantity_gt }),
      ...(isSet(inventoryAtpQuantity_lt) && { 'InventoryATPQuantity.lt': inventoryAtpQuantity_lt }),
      ...(isSet(inventoryAtpQuantity_gte) && { 'InventoryATPQuantity.gte': inventoryAtpQuantity_gte }),
      ...(isSet(inventoryAtpQuantity_lte) && { 'InventoryATPQuantity.lte': inventoryAtpQuantity_lte }),
    } : {}),
    ...(apiVersion === 'v3.2' ? {
      ...(isSet(undamagedQuantity_eq) && { 'UndamagedQuantity.eq': undamagedQuantity_eq }),
      ...(isSet(undamagedQuantity_gt) && { 'UndamagedQuantity.gt': undamagedQuantity_gt }),
      ...(isSet(undamagedQuantity_lt) && { 'UndamagedQuantity.lt': undamagedQuantity_lt }),
      ...(isSet(undamagedQuantity_gte) && { 'UndamagedQuantity.gte': undamagedQuantity_gte }),
      ...(isSet(undamagedQuantity_lte) && { 'UndamagedQuantity.lte': undamagedQuantity_lte }),
      ...(isSet(currentAtpQuantity_eq) && { 'CurrentATPQuantity.eq': currentAtpQuantity_eq }),
      ...(isSet(currentAtpQuantity_gt) && { 'CurrentATPQuantity.gt': currentAtpQuantity_gt }),
      ...(isSet(currentAtpQuantity_lt) && { 'CurrentATPQuantity.lt': currentAtpQuantity_lt }),
      ...(isSet(currentAtpQuantity_gte) && { 'CurrentATPQuantity.gte': currentAtpQuantity_gte }),
      ...(isSet(currentAtpQuantity_lte) && { 'CurrentATPQuantity.lte': currentAtpQuantity_lte }),
    } : {}),
  };

  if (!Object.keys(params).length) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CRITERIA',
        message: 'At least one filter is required, and criteria must match the API version.',
      },
    };
  }

  return logiwaClient.fetch({
    method: 'get',
    url: `/Report/AvailableToPromise/i/${ page }/s/${ perPage }`,
    params,
    context: {
      credsPayload,
      apiVersion,
    },
  });
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['criteria'],
]);

const logiwaReportGetAvailableToPromise = async (
  credsPayload,
  criteria,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    criteria,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    criteria,
    logiwaReportGetAvailableToPromiseSingle,
    (singleCriteria) => ({
      args: [
        credsPayload,
        {
          ...singleCriteria,
          ...options,
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
  logiwaReportGetAvailableToPromise,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaReportGetAvailableToPromise" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "criteria": { "clientIdentifier_eq": "9f1ea39a-fccc-48af-8986-a35c34fcef8b" }
  }'

curl -X POST "http://localhost:8000/logiwaReportGetAvailableToPromise" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "criteria": [
      { "sku_eq": "EXDAL355-15-S/M" },
      { "sku_eq": "EXD535-1-XXS/XS" }
    ]
  }'
*/
