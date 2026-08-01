// https://developers.etsy.com/documentation/reference/#operation/updateShopShippingProfile

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shippingProfileId'],
  ['updatePayload'],
]);

const etsyShopShippingProfileUpdate = async (
  credsPayload,
  shippingProfileId,
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
    shippingProfileId,
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
      url: `/application/shops/${ shopId }/shipping-profiles/${ shippingProfileId }`,
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
  etsyShopShippingProfileUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopShippingProfileUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "shippingProfileId": "123456789",
    "updatePayload": {
      ...
    }
  }'
*/
