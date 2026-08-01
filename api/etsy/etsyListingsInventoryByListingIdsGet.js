// https://developers.etsy.com/documentation/reference/#operation/getListingsInventoryByListingIds

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyListingsInventoryByListingIdsGet = async (
  credsPayload,
  {
    params,
    inspect = false,
    fetchClient = etsyClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/listings/batch/inventory`,
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
  etsyListingsInventoryByListingIdsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyListingsInventoryByListingIdsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "options": {
      "params": {
        "listing_ids": "1527825785"
      }
    }
  }'
*/
