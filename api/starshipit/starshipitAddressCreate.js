// https://api-docs.starshipit.com/#f577d747-7227-432f-bbc2-d9e2db08578f

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['addressPayload'],
]);

const starshipitAddressCreate = async (
  credsPayload,
  addressPayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    addressPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await starshipitClient.fetch({
    requestPayload: {
      url: '/addressbook',
      method: 'post',
      body: {
        address: addressPayload,
      },
    },
    context: {
      credsPayload,
    },
  });

  if (!response?.ok) {
    return response;
  }

  const { id, address } = response.data || {};

  return {
    ...response,
    data: {
      id,
      ...address,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitAddressCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitAddressCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" },
    "addressPayload": {
      "name": "John Doe",
      "street": "123 Main St",
      "suburb": "Wherever",
      "city": "Sydney",
      "state": "NSW",
      "post_code": "2000",
      "country": "Australia"
    }
  }'
*/
