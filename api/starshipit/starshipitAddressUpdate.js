// https://api-docs.starshipit.com/#4ff9ae6f-fadb-4c50-9087-467c2e336f93

const { ArgsWarden, credsFromPayload } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['addressId'],
  ['updatePayload'],
]);

const starshipitAddressUpdate = async (
  credsPayload,
  addressId,
  updatePayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    addressId,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const response = await starshipitClient.fetch({
    url: '/addressbook/update',
    method: 'post',
    body: {
      id: addressId,
      address: updatePayload,
    },
    context: {
      creds,
    },
  });

  if (!response?.ok) {
    return response;
  }

  return {
    ...response,
    data: response.data?.address ?? response.data,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitAddressUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitAddressUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" },
    "addressId": 14824685,
    "updatePayload": { "name": "Batman" }
  }'
*/
