// https://developers.etsy.com/documentation/reference/#operation/createReceiptShipment

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['receiptId'],
  ['createPayload'],
]);

const etsyReceiptShipmentCreate = async (
  credsPayload,
  receiptId,
  createPayload,
  {
    shopId,
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    receiptId,
    createPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopId({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  return etsyClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/application/shops/${ shopId }/receipts/${ receiptId }/tracking`,
      body: createPayload,
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
  etsyReceiptShipmentCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyReceiptShipmentCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "receiptId": "3759771968",
    "createPayload": {
      ...
    }
  }'
*/
