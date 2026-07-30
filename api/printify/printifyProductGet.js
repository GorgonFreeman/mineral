// https://developers.printify.com/#retrieve-a-product

const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productId'],
]);

const printifyProductGetSingle = async (
  credsPayload,
  productId,
  {
    shopId,
  } = {},
) => {
  return printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/shops/${ shopId }/products/${ productId }.json`,
    },
    context: { credsPayload },
  });
};

const printifyProductGet = async (
  credsPayload,
  productId,
  {
    shopId,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopIdFromCreds({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  return actionSingleOrMultiple(
    productId,
    printifyProductGetSingle,
    (productIdItem) => ({
      args: [credsPayload, productIdItem, { shopId }],
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
  printifyProductGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/printifyProductGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "printify" },
    "productId": "67a3f38542eab3720306975b"
  }'
*/
