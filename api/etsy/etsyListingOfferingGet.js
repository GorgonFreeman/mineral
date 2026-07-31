// https://developers.etsy.com/documentation/reference/#operation/getListingOffering

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['listingId'],
  ['productId'],
  ['productOfferingId'],
]);

const etsyListingOfferingGet = async (
  credsPayload,
  listingId,
  productId,
  productOfferingId,
  {
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    listingId,
    productId,
    productOfferingId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return etsyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/listings/${ listingId }/products/${ productId }/offerings/${ productOfferingId }`,
      ...(params && { params }),
    },
    context: {
      credsPayload,
      withAccessToken: false,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyListingOfferingGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyListingOfferingGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "listingId": "1234567890",
    "productId": "1234567890",
    "productOfferingId": "1234567890"
  }'
*/
