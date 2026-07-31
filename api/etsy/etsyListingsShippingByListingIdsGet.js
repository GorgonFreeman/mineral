// https://developers.etsy.com/documentation/reference/#operation/getListingsShippingByListingIds

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyListingsShippingByListingIdsGet = async (
  credsPayload,
  {
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return etsyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/listings/batch/shipping`,
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
  etsyListingsShippingByListingIdsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyListingsShippingByListingIdsGet" \
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
