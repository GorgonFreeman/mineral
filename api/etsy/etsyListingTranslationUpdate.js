// https://developers.etsy.com/documentation/reference/#operation/updateListingTranslation

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['listingId'],
  ['language'],
  ['updatePayload'],
]);

const etsyListingTranslationUpdate = async (
  credsPayload,
  listingId,
  language,
  updatePayload,
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
    language,
    updatePayload,
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
      method: 'put',
      url: `/application/shops/${ shopId }/listings/${ listingId }/translations/${ language }`,
      body: updatePayload,
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
  etsyListingTranslationUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyListingTranslationUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "listingId": "1234567890",
    "language": "en",
    "updatePayload": {
      ...
    }
  }'
*/
