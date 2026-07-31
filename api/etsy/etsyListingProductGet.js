// https://developers.etsy.com/documentation/reference/#operation/getListingProduct

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['listingId'],
  ['productId'],
]);

const etsyListingProductGet = async (
  credsPayload,
  listingId,
  productId,
  {
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    listingId,
    productId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return etsyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/listings/${ listingId }/inventory/products/${ productId }`,
    },
    context: {
      credsPayload,
      withBearer: true,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyListingProductGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyListingProductGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "etsy" },
    "listingId": "1508355670",
    "productId": "17315318266"
  }'
*/
