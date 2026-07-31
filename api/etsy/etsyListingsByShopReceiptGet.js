// https://developers.etsy.com/documentation/reference/#operation/getListingsByShopReceipt

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');
const { resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['receiptId'],
]);

const etsyListingsByShopReceiptGet = async (
  returnGetter,

  credsPayload,
  receiptId,
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
    receiptId,
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
    `/application/shops/${ shopId }/receipts/${ receiptId }/listings`,
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
  etsyListingsByShopReceiptGet: (...args) => etsyListingsByShopReceiptGet(false, ...args),
  etsyListingsByShopReceiptGetter: (...args) => etsyListingsByShopReceiptGet(true, ...args),
  funcApiConfig,
};
