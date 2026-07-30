// https://developers.printify.com/#update-a-webhook

const { ArgsWarden, actionSingleOrMultiple, everyIfArray, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const webhookUpdateValidator = (webhookUpdate) => {
  return valueProvided(webhookUpdate?.webhookId)
    && valueProvided(webhookUpdate?.updatePayload);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['webhookUpdate', (webhookUpdate) => everyIfArray(webhookUpdateValidator, webhookUpdate)],
]);

const printifyWebhookUpdateSingle = async (
  credsPayload,
  webhookUpdate,
  {
    shopId,
  } = {},
) => {
  const {
    webhookId,
    updatePayload,
  } = webhookUpdate;

  return printifyClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/shops/${ shopId }/webhooks/${ webhookId }.json`,
      body: updatePayload,
    },
    context: { credsPayload },
  });
};

const printifyWebhookUpdate = async (
  credsPayload,
  webhookUpdate,
  {
    shopId,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    webhookUpdate,
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
    webhookUpdate,
    printifyWebhookUpdateSingle,
    (webhookUpdateItem) => ({
      args: [credsPayload, webhookUpdateItem, { shopId }],
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
  printifyWebhookUpdate,
  funcApiConfig,
};
