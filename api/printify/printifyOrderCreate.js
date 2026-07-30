// https://developers.printify.com/#create-a-new-order

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['externalId'],
  ['shippingMethod'],
  ['addressTo'],
  ['lineItems'],
]);

const printifyOrderCreate = async (
  credsPayload,
  externalId,
  shippingMethod,
  addressTo,
  lineItems,
  {
    shopId,
    label,
    expressShipping,
    economyShipping,
    sendShippingNotification = true,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    externalId,
    shippingMethod,
    addressTo,
    lineItems,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopIdFromCreds({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  return printifyClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/shops/${ shopId }/orders.json`,
      body: {
        external_id: externalId,
        shipping_method: shippingMethod,
        address_to: addressTo,
        line_items: lineItems,
        ...(label && { label }),
        ...(expressShipping && { is_express: expressShipping }),
        ...(economyShipping && { is_economy: economyShipping }),
        ...(sendShippingNotification && { send_shipping_notification: sendShippingNotification }),
      },
    },
    context: { credsPayload },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyOrderCreate,
  funcApiConfig,
};
