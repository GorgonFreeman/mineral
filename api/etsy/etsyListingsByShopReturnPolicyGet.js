// https://developers.etsy.com/documentation/reference/#operation/getListingsByShopReturnPolicy

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['returnPolicyId'],
]);

const etsyListingsByShopReturnPolicyGet = async (
  credsPayload,
  returnPolicyId,
  {
    shopId,
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    returnPolicyId,
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
      url: `/application/shops/${ shopId }/policies/return/${ returnPolicyId }/listings`,
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
  etsyListingsByShopReturnPolicyGet,
  funcApiConfig,
};
