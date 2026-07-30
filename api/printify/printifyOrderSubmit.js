// https://developers.printify.com/#send-order-to-production

const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderId'],
]);

const printifyOrderSubmitSingle = async (
  credsPayload,
  orderId,
  {
    shopId,
  } = {},
) => {
  return printifyClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/shops/${ shopId }/orders/${ orderId }/send_to_production.json`,
    },
    context: { credsPayload },
  });
};

const printifyOrderSubmit = async (
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
    printifyOrderSubmitSingle,
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
  printifyOrderSubmit,
  funcApiConfig,
};
