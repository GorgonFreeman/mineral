// https://developers.printify.com/#retrieve-a-product

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['shopId'],
  ['credsPayload', credsValidator],
  ['productId'],
]);

const printifyProductGet = async (
  shopId,
  credsPayload,
  productId,
  options = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    shopId,
    credsPayload,
    productId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/shops/${ shopId }/products/${ productId }.json`,
    },
    context: {
      credsPayload,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyProductGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/printifyProductGet" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "10363118",
    "credsPayload": { "credsPath": "printify" },
    "productId": "67a3f38542eab3720306975b"
  }'
*/
