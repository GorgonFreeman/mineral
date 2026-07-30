// https://developers.printify.com/#delete-a-webhook

const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['webhookId'],
]);

const printifyWebhookDeleteSingle = async (
  credsPayload,
  webhookId,
  {
    shopId,
  } = {},
) => {
  return printifyClient.fetch({
    requestPayload: {
      method: 'delete',
      url: `/shops/${ shopId }/webhooks/${ webhookId }.json`,
    },
    context: { credsPayload },
  });
};

const printifyWebhookDelete = async (
  credsPayload,
  webhookId,
  {
    shopId,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    webhookId,
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
    webhookId,
    printifyWebhookDeleteSingle,
    (webhookIdItem) => ({
      args: [credsPayload, webhookIdItem, { shopId }],
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
  printifyWebhookDelete,
  funcApiConfig,
};
