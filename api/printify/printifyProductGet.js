// https://developers.printify.com/#retrieve-a-product

const { ArgsWarden, credsFromPayload } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productId'],
]);

const printifyProductGet = async (
  credsPayload,
  productId,
  {
    shopId, // required but since it's relatively static, we've allowed it to come from creds.
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  if (!shopId) {
    const creds = await credsFromPayload(credsPayload);
    ({ SHOP_ID: shopId } = creds);
  }

  if (!shopId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'shopId is required',
      },
    };
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
    "credsPayload": { "credsPath": "printify" },
    "productId": "67a3f38542eab3720306975b"
  }'
*/
