// https://myapi.logiwa.com/swagger/index.html#/Product/get_v3_1_Product_detail__id_

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productId'],
]);

const logiwaProductGet = async (
  credsPayload,
  productId,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return logiwaClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/Product/detail/${ productId }`,
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
  logiwaProductGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaProductGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "productId": "261a02aa-ce5a-4b06-a528-d419e0aa87a1"
  }'
*/
