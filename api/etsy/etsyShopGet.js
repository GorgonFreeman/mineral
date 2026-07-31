// https://developers.etsy.com/documentation/reference/#operation/getShop

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyShopGet = async (
  credsPayload,
  {
    shopId,
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
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
      method: 'get',
      url: `/application/shops/${ shopId }`,
      ...(params && { params }),
    },
    context: {
      credsPayload,
      withAccessToken: false,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyShopGet,
  funcApiConfig,
};
