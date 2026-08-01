// https://developers.etsy.com/documentation/reference/#operation/updateShopShippingProfileUpgrade

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shippingProfileId'],
  ['upgradeId'],
  ['updatePayload'],
]);

const etsyShopShippingProfileUpgradeUpdate = async (
  credsPayload,
  shippingProfileId,
  upgradeId,
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
    upgradeId,
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
      url: `/application/shops/${ shopId }/shipping-profiles/${ shippingProfileId }/upgrades/${ upgradeId }`,
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
  etsyShopShippingProfileUpgradeUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopShippingProfileUpgradeUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "shippingProfileId": "123456789",
    "upgradeId": "123456789",
    "updatePayload": {
      ...
    }
  }'
*/
