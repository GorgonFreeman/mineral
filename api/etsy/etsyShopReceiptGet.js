// https://developers.etsy.com/documentation/reference/#operation/getShopReceipt

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['receiptId'],
]);

const etsyShopReceiptGet = async (
  credsPayload,
  receiptId,
  {
    shopId,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    receiptId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopId({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  const response = await etsyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/shops/${ shopId }/receipts/${ receiptId }`,
    },
    context: {
      credsPayload,
      withAccessToken: true,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyShopReceiptGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopReceiptGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "etsy" },
    "receiptId": "3759771968"
  }'
*/
