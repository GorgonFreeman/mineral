// https://developers.etsy.com/documentation/reference/#operation/createShopShippingProfileUpgrade

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shippingProfileId'],
  ['createPayload'],
]);

const etsyShopShippingProfileUpgradeCreate = async (
  credsPayload,
  shippingProfileId,
  createPayload,
  {
    shopId,
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    shippingProfileId,
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

  return etsyClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/application/shops/${ shopId }/shipping-profiles/${ shippingProfileId }/upgrades`,
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
  etsyShopShippingProfileUpgradeCreate,
  funcApiConfig,
};
