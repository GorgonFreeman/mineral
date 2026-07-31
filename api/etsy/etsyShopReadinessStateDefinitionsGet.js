// https://developers.etsy.com/documentation/reference/#operation/getShopReadinessStateDefinitions

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');
const { resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyShopReadinessStateDefinitionsGet = async (
  returnGetter,

  credsPayload,
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
    `/application/shops/${ shopId }/readiness-state-definitions`,
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
  etsyShopReadinessStateDefinitionsGet: (...args) => etsyShopReadinessStateDefinitionsGet(false, ...args),
  etsyShopReadinessStateDefinitionsGetter: (...args) => etsyShopReadinessStateDefinitionsGet(true, ...args),
  funcApiConfig,
};
