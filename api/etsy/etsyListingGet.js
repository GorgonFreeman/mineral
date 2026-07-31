// https://developers.etsy.com/documentation/reference/#operation/getListing

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['listingId'],
]);

const etsyListingGet = async (
  credsPayload,
  listingId,
  {
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    listingId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return etsyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/listings/${ listingId }`,
      ...(params && { params }),
    },
    context: {
      credsPayload,
      withAccessToken: false,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyListingGet,
  funcApiConfig,
};
