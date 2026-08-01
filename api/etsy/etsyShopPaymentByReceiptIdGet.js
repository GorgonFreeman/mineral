// https://developers.etsy.com/documentation/reference/#operation/getShopPaymentByReceiptId

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['receiptId'],
]);

const etsyShopPaymentByReceiptIdGet = async (
  credsPayload,
  receiptId,
  {
    shopId,
    params,
    inspect = false,
    fetchClient = etsyClient,
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

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/shops/${ shopId }/receipts/${ receiptId }/payments`,
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
  etsyShopPaymentByReceiptIdGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopPaymentByReceiptIdGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "receiptId": "3759771968"
  }'
*/
