// https://developers.etsy.com/documentation/reference/#operation/findAllActiveListingsByShop

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');
const { resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyShopListingsActiveGet = async (
  returnGetter,

  credsPayload,
  {
    shopId,
    params: paramsOption,
    perPage,
    sortOn,
    sortOrder,
    keywords,
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
    ...(sortOn !== undefined && { sort_on: sortOn }),
    ...(sortOrder !== undefined && { sort_order: sortOrder }),
    ...(keywords !== undefined && { keywords: keywords }),
  };

  const getterArgs = [
    credsPayload,
    `/application/shops/${ shopId }/listings/active`,
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
  etsyShopListingsActiveGet: (...args) => etsyShopListingsActiveGet(false, ...args),
  etsyShopListingsActiveGetter: (...args) => etsyShopListingsActiveGet(true, ...args),
  funcApiConfig,
};
