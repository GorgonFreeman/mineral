// https://developers.etsy.com/documentation/reference/#operation/deleteShopShippingProfileDestination

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shippingProfileId'],
  ['shippingProfileDestinationId'],
]);

const etsyShopShippingProfileDestinationDelete = async (
  credsPayload,
  shippingProfileId,
  shippingProfileDestinationId,
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
      method: 'delete',
      url: `/application/shops/${ shopId }/shipping-profiles/${ shippingProfileId }/destinations/${ shippingProfileDestinationId }`,
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
  etsyShopShippingProfileDestinationDelete,
  funcApiConfig,
};
