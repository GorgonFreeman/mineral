// https://myapi.logiwa.com/swagger/index.html#/Product/get_v3_1_Product_list_i__index__s__size_

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const logiwaProductsGet = async (
  credsPayload,
  {
    apiVersion,
    page = 0,
    perPage = MAX_PER_PAGE,
    sku_eq,
    fnsku_eq,
    clientIdentifier_eq,
    clientIdentifier_in,
    identifier_eq,
    createdDateTime_bt,
    updatedDateTime_bt,
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
    ...(fnsku_eq && { 'FNSKU.eq': fnsku_eq }),
    ...(clientIdentifier_eq && { 'ClientIdentifier.eq': clientIdentifier_eq }),
    ...(clientIdentifier_in && { 'ClientIdentifier.in': clientIdentifier_in }),
    ...(identifier_eq && { 'Identifier.eq': identifier_eq }),
    ...(createdDateTime_bt && { 'CreatedDateTime.bt': createdDateTime_bt }),
    ...(updatedDateTime_bt && { 'UpdatedDateTime.bt': updatedDateTime_bt }),
    ...(productTypeName_eq && { 'ProductTypeName.eq': productTypeName_eq }),
    ...(productGroupName_eq && { 'ProductGroupName.eq': productGroupName_eq }),
  };

  return logiwaClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/Product/list/i/${ page }/s/${ perPage }`,
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
  logiwaProductsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaProductsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" }
  }'

curl -X POST "http://localhost:8000/logiwaProductsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "options": { "sku_eq": "EXD1684-2-L" }
  }'
*/
