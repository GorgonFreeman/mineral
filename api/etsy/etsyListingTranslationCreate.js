// https://developers.etsy.com/documentation/reference/#operation/createListingTranslation

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['listingId'],
  ['language'],
  ['createPayload'],
]);

const etsyListingTranslationCreate = async (
  credsPayload,
  listingId,
  language,
  createPayload,
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
    createPayload,
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
      method: 'post',
      url: `/application/shops/${ shopId }/listings/${ listingId }/translations/${ language }`,
      body: createPayload,
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
  etsyListingTranslationCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyListingTranslationCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "listingId": "1234567890",
    "language": "en",
    "createPayload": {
      ...
    }
  }'
*/
