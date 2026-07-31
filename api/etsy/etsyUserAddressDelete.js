// https://developers.etsy.com/documentation/reference/#operation/deleteUserAddress

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['addressId'],
]);

const etsyUserAddressDelete = async (
  credsPayload,
  addressId,
  {
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    addressId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return etsyClient.fetch({
    requestPayload: {
      method: 'delete',
      url: `/application/user/addresses/${ addressId }`,
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
  etsyUserAddressDelete,
  funcApiConfig,
};
