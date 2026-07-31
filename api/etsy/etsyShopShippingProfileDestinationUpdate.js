// https://developers.etsy.com/documentation/reference/#operation/updateShopShippingProfileDestination

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shippingProfileId'],
  ['shippingProfileDestinationId'],
  ['updatePayload'],
]);

const etsyShopShippingProfileDestinationUpdate = async (
  credsPayload,
  shippingProfileId,
  shippingProfileDestinationId,
  updatePayload,
  {
    shopId,
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    shippingProfileId,
    shippingProfileDestinationId,
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
      url: `/application/shops/${ shopId }/shipping-profiles/${ shippingProfileId }/destinations/${ shippingProfileDestinationId }`,
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
  etsyShopShippingProfileDestinationUpdate,
  funcApiConfig,
};
