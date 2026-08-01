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
    fetchClient = etsyClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    addressId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
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

/*
curl -X POST "http://localhost:8000/etsyUserAddressDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "addressId": "1296125024835"
  }'
*/
