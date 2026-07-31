// https://developers.etsy.com/documentation/reference/#operation/getUserAddresses

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyUserAddressesGet = async (
  returnGetter,

  credsPayload,
  {
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

  const params = {
    ...paramsOption,

  };

  const getterArgs = [
    credsPayload,
    `/application/user/addresses`,
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
  etsyUserAddressesGet: (...args) => etsyUserAddressesGet(false, ...args),
  etsyUserAddressesGetter: (...args) => etsyUserAddressesGet(true, ...args),
  funcApiConfig,
};
