// https://api-docs.starshipit.com/#0cd0b1b0-7ba4-4da3-8c94-67cb4e020a6d

const { ArgsWarden, credsFromPayload } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['addressId'],
]);

const starshipitAddressDelete = async (
  credsPayload,
  addressId,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    addressId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  return starshipitClient.fetch({
    url: '/addressbook/delete',
    method: 'post',
    body: {
      address_ids: [addressId],
    },
    context: {
      creds,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitAddressDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitAddressDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" },
    "addressId": "14824686"
  }'
*/
