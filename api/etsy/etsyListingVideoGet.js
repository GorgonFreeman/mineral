// https://developers.etsy.com/documentation/reference/#operation/getListingVideo

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['videoId'],
  ['listingId'],
]);

const etsyListingVideoGet = async (
  credsPayload,
  videoId,
  listingId,
  {
    params,
    inspect = false,
    fetchClient = etsyClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    videoId,
    listingId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/listings/${ listingId }/videos/${ videoId }`,
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
  etsyListingVideoGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyListingVideoGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "videoId": "123456789",
    "listingId": "1234567890"
  }'
*/
