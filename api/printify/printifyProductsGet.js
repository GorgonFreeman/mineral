// https://developers.printify.com/#retrieve-a-list-of-products

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyGet, printifyGetter } = require('../printify/printifyGet');
const { resolveShopIdFromCreds } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const printifyProductsGet = async (
  returnGetter,

  credsPayload,
  {
    shopId,
    perPage,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopIdFromCreds({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  const getterArgs = [
    credsPayload,
    `/shops/${ shopId }/products.json`,
    {
      ...(perPage && { params: { limit: perPage } }),
      ...getterOptions,
    },
  ];

  return returnGetter
    ? printifyGetter(...getterArgs)
    : printifyGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyProductsGet: (...args) => printifyProductsGet(false, ...args),
  printifyProductsGetter: (...args) => printifyProductsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/printifyProductsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "printify" },
    "options": { "perPage": 10 }
  }'
*/
