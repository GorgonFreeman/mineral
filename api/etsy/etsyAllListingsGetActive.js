// https://developers.etsy.com/documentation/reference/#operation/findAllListingsActive

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyAllListingsGetActive = async (
  returnGetter,

  credsPayload,
  {
    params: paramsOption,
    perPage,
    keywords,
    sortOn,
    sortOrder,
    minPrice,
    maxPrice,
    taxonomyId,
    shopLocation,
    isSafe,
    currency,
    buyerCountry,
    withAccessToken = false,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const params = {
    ...paramsOption,
    ...(keywords !== undefined && { keywords: keywords }),
    ...(sortOn !== undefined && { sort_on: sortOn }),
    ...(sortOrder !== undefined && { sort_order: sortOrder }),
    ...(minPrice !== undefined && { min_price: minPrice }),
    ...(maxPrice !== undefined && { max_price: maxPrice }),
    ...(taxonomyId !== undefined && { taxonomy_id: taxonomyId }),
    ...(shopLocation !== undefined && { shop_location: shopLocation }),
    ...(isSafe !== undefined && { is_safe: isSafe }),
    ...(currency !== undefined && { currency: currency }),
    ...(buyerCountry !== undefined && { buyer_country: buyerCountry }),
  };

  const getterArgs = [
    credsPayload,
    `/application/listings/active`,
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
  etsyAllListingsGetActive: (...args) => etsyAllListingsGetActive(false, ...args),
  etsyAllListingsGetActiveGetter: (...args) => etsyAllListingsGetActive(true, ...args),
  funcApiConfig,
};
