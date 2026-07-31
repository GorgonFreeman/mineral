// https://developers.etsy.com/documentation/reference/#operation/getShopReceiptTransactionsByShop

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');
const { resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyShopReceiptTransactionsByShopGet = async (
  returnGetter,

  credsPayload,
  {
    shopId,
    params: paramsOption,
    perPage,
    legacy,
    withAccessToken = true,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopId({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  const params = {
    ...paramsOption,
    ...(legacy !== undefined && { legacy: legacy }),
  };

  const getterArgs = [
    credsPayload,
    `/application/shops/${ shopId }/transactions`,
    {
      params,
      perPage,
      withAccessToken,
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
  etsyShopReceiptTransactionsByShopGet: (...args) => etsyShopReceiptTransactionsByShopGet(false, ...args),
  etsyShopReceiptTransactionsByShopGetter: (...args) => etsyShopReceiptTransactionsByShopGet(true, ...args),
  funcApiConfig,
};
