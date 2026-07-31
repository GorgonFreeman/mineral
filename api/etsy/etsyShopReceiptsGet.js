// https://developers.etsy.com/documentation/reference/#operation/getShopReceipts

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');
const { resolveShopIdFromCreds } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyShopReceiptsGet = async (
  returnGetter,

  credsPayload,
  {
    shopId,
    params,
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
    `/application/shops/${ shopId }/receipts`,
    {
      params,
      perPage,
      ...getterOptions,
    },
  ];

  return returnGetter
    ? etsyGetter(...getterArgs)
    : etsyGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyShopReceiptsGet: (...args) => etsyShopReceiptsGet(false, ...args),
  etsyShopReceiptsGetter: (...args) => etsyShopReceiptsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopReceiptsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "etsy" }
  }'
*/
