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
    fetchClient = etsyClient,
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

  return fetchClient.fetch({
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

/*
curl -X POST "http://localhost:8000/etsyShopShippingProfileDestinationDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "shippingProfileId": "123456789",
    "shippingProfileDestinationId": "123456789"
  }'
*/
