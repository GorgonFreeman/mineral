// https://developers.etsy.com/documentation/reference/#operation/getShopReceiptTransactionsByListing

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');
const { resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['listingId'],
]);

const etsyShopReceiptTransactionsByListingGet = async (
  returnGetter,

  credsPayload,
  listingId,
  {
    shopId,
    params: paramsOption,
    perPage,
    legacy,
    withAccessToken = true,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    listingId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopId({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  const params = {
    ...paramsOption,
    ...(legacy !== undefined && { legacy: legacy }),
  };

  const getterArgs = [
    credsPayload,
    `/application/shops/${ shopId }/listings/${ listingId }/transactions`,
    {
      params,
      perPage,
      withAccessToken,
      ...getterOptions,
    },
  ];

  return returnGetter
    ? etsyGetter(...getterArgs)
    : etsyGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyShopReceiptTransactionsByListingGet: (...args) => etsyShopReceiptTransactionsByListingGet(false, ...args),
  etsyShopReceiptTransactionsByListingGetter: (...args) => etsyShopReceiptTransactionsByListingGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopReceiptTransactionsByListingGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "listingId": "1234567890"
  }'
*/
