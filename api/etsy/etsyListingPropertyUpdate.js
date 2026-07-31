// https://developers.etsy.com/documentation/reference/#operation/updateListingProperty

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['listingId'],
  ['propertyId'],
  ['updatePayload'],
]);

const etsyListingPropertyUpdate = async (
  credsPayload,
  listingId,
  propertyId,
  updatePayload,
  {
    shopId,
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    listingId,
    propertyId,
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

  return etsyClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/application/shops/${ shopId }/listings/${ listingId }/properties/${ propertyId }`,
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
  etsyListingPropertyUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyListingPropertyUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "listingId": "1234567890",
    "propertyId": "123456789",
    "updatePayload": {
      ...
    }
  }'
*/
