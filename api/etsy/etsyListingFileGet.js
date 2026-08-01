// https://developers.etsy.com/documentation/reference/#operation/getListingFile

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['listingId'],
  ['listingFileId'],
]);

const etsyListingFileGet = async (
  credsPayload,
  listingId,
  listingFileId,
  {
    shopId,
    params,
    inspect = false,
    fetchClient = etsyClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    listingId,
    listingFileId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopId({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/shops/${ shopId }/listings/${ listingId }/files/${ listingFileId }`,
      ...(params && { params }),
    },
    context: {
      credsPayload,
      withAccessToken: true,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyListingFileGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyListingFileGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "listingId": "1234567890",
    "listingFileId": "123456789"
  }'
*/
