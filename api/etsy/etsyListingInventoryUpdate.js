// https://developers.etsy.com/documentation/reference/#operation/updateListingInventory

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['listingId'],
  ['updatePayload'],
]);

const etsyListingInventoryUpdate = async (
  credsPayload,
  listingId,
  updatePayload,
  {
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    listingId,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return etsyClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/application/listings/${ listingId }/inventory`,
      body: updatePayload,
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
  etsyListingInventoryUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyListingInventoryUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "listingId": "1234567890",
    "updatePayload": {}
  }'
*/
