// https://myapi.logiwa.com/swagger/index.html#/Report/get_v3_1_Report_InventoryCalculation_i__index__s__size_

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['warehouseIdentifier_eq'],
]);

const logiwaReportGetInventoryCalculation = async (
  credsPayload,
  warehouseIdentifier_eq,
  {
    apiVersion,
    page = 0,
    perPage = MAX_PER_PAGE,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    warehouseIdentifier_eq,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const params = {
    'WarehouseIdentifier.eq': warehouseIdentifier_eq,
  };

  return logiwaClient.fetch({
    method: 'get',
    url: `/Report/InventoryCalculation/i/${ page }/s/${ perPage }`,
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
  logiwaReportGetInventoryCalculation,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaReportGetInventoryCalculation" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "warehouseIdentifier_eq": "cfbdf154-3052-4e18-84f3-b93b7cde2875"
  }'
*/
