// https://developers.etsy.com/documentation/reference/#operation/getReviewsByListing

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['listingId'],
]);

const etsyReviewsByListingGet = async (
  returnGetter,

  credsPayload,
  listingId,
  {
    params: paramsOption,
    perPage,
    minCreated,
    maxCreated,
    withAccessToken = false,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    listingId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const params = {
    ...paramsOption,
    ...(minCreated !== undefined && { min_created: minCreated }),
    ...(maxCreated !== undefined && { max_created: maxCreated }),
  };

  const getterArgs = [
    credsPayload,
    `/application/listings/${ listingId }/reviews`,
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
  etsyReviewsByListingGet: (...args) => etsyReviewsByListingGet(false, ...args),
  etsyReviewsByListingGetter: (...args) => etsyReviewsByListingGet(true, ...args),
  funcApiConfig,
};
