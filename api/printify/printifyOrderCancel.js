// https://developers.printify.com/#cancel-an-order

const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderId'],
]);

const printifyOrderCancelSingle = async (
  credsPayload,
  orderId,
  {
    shopId,
  } = {},
) => {
  return printifyClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/shops/${ shopId }/orders/${ orderId }/cancel.json`,
    },
    context: { credsPayload },
  });
};

const printifyOrderCancel = async (
  credsPayload,
  orderId,
  {
    shopId,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderId,
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
    orderId,
    printifyOrderCancelSingle,
    (orderIdItem) => ({
      args: [credsPayload, orderIdItem, { shopId }],
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
  printifyOrderCancel,
  funcApiConfig,
};
