// https://developers.etsy.com/documentation/reference/#operation/getShopShippingProfileUpgrades

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shippingProfileId'],
]);

const etsyShopShippingProfileUpgradesGet = async (
  credsPayload,
  shippingProfileId,
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
      url: `/application/shops/${ shopId }/shipping-profiles/${ shippingProfileId }/upgrades`,
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
  etsyShopShippingProfileUpgradesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopShippingProfileUpgradesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "shippingProfileId": "123456789"
  }'
*/
