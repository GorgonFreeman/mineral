// https://developers.printify.com/#retrieve-order

const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderId'],
]);

const printifyOrderGetSingle = async (
  credsPayload,
  orderId,
  {
    shopId,
  } = {},
) => {
  return printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/shops/${ shopId }/orders/${ orderId }.json`,
    },
    context: { credsPayload },
  });
};

const printifyOrderGet = async (
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
    printifyOrderGetSingle,
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
  printifyOrderGet,
  funcApiConfig,
};
