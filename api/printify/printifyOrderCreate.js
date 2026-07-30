// https://developers.printify.com/#create-a-new-order

const { ArgsWarden, actionSingleOrMultiple, everyIfArray, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const orderPayloadValidator = (orderPayload) => {
  return valueProvided(orderPayload?.externalId)
    && valueProvided(orderPayload?.shippingMethod)
    && valueProvided(orderPayload?.addressTo)
    && Array.isArray(orderPayload?.lineItems);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderPayload', (orderPayload) => everyIfArray(orderPayloadValidator, orderPayload)],
]);

const printifyOrderCreateSingle = async (
  credsPayload,
  orderPayload,
  {
    shopId,
  } = {},
) => {
  const {
    externalId,
    shippingMethod,
    addressTo,
    lineItems,
    label,
    expressShipping,
    economyShipping,
    sendShippingNotification = true,
  } = orderPayload;

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

const printifyOrderCreate = async (
  credsPayload,
  orderPayload,
  {
    shopId,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopIdFromCreds({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  return actionSingleOrMultiple(
    orderPayload,
    printifyOrderCreateSingle,
    (orderPayloadItem) => ({
      args: [credsPayload, orderPayloadItem, { shopId }],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyOrderCreate,
  funcApiConfig,
};
