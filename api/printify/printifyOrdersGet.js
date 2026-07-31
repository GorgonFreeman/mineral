// https://developers.printify.com/#retrieve-a-list-of-orders

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyGet, printifyGetter } = require('../printify/printifyGet');
const { resolveShopIdFromCreds } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const printifyOrdersGet = async (
  returnGetter,

  credsPayload,
  {
    shopId,
    perPage,
    status,
    sku,
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
    `/shops/${ shopId }/orders.json`,
    {
      params: {
        ...(perPage && { limit: perPage }),
        ...(status && { status }),
        ...(sku && { sku }),
      },
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
  printifyOrdersGet: (...args) => printifyOrdersGet(false, ...args),
  printifyOrdersGetter: (...args) => printifyOrdersGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/printifyOrdersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "printify" }
  }'
*/
