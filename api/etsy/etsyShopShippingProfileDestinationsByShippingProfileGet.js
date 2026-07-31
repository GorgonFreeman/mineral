// https://developers.etsy.com/documentation/reference/#operation/getShopShippingProfileDestinationsByShippingProfile

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');
const { resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shippingProfileId'],
]);

const etsyShopShippingProfileDestinationsByShippingProfileGet = async (
  returnGetter,

  credsPayload,
  shippingProfileId,
  {
    shopId,
    params: paramsOption,
    perPage,

    withAccessToken = true,
    ...getterOptions
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

  const params = {
    ...paramsOption,

  };

  const getterArgs = [
    credsPayload,
    `/application/shops/${ shopId }/shipping-profiles/${ shippingProfileId }/destinations`,
    {
      params,
      perPage,
      withAccessToken,
      ...getterOptions,
    },
  ];

  return returnGetter
    ? etsyGetter(...getterArgs)
    : etsyGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyShopShippingProfileDestinationsByShippingProfileGet: (...args) => etsyShopShippingProfileDestinationsByShippingProfileGet(false, ...args),
  etsyShopShippingProfileDestinationsByShippingProfileGetter: (...args) => etsyShopShippingProfileDestinationsByShippingProfileGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopShippingProfileDestinationsByShippingProfileGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "shippingProfileId": "123456789"
  }'
*/
