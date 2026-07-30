// https://developers.printify.com/#create-a-new-webhook

const { ArgsWarden, actionSingleOrMultiple, everyIfArray, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const webhookPayloadValidator = (webhookPayload) => {
  return valueProvided(webhookPayload?.topic)
    && valueProvided(webhookPayload?.webhookUrl);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['webhookPayload', (webhookPayload) => everyIfArray(webhookPayloadValidator, webhookPayload)],
]);

const printifyWebhookCreateSingle = async (
  credsPayload,
  webhookPayload,
  {
    shopId,
  } = {},
) => {
  const {
    topic,
    webhookUrl,
  } = webhookPayload;

  return printifyClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/shops/${ shopId }/webhooks.json`,
      body: {
        topic,
        url: webhookUrl,
      },
    },
    context: { credsPayload },
  });
};

const printifyWebhookCreate = async (
  credsPayload,
  webhookPayload,
  {
    shopId,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    webhookPayload,
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
    webhookPayload,
    printifyWebhookCreateSingle,
    (webhookPayloadItem) => ({
      args: [credsPayload, webhookPayloadItem, { shopId }],
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
  printifyWebhookCreate,
  funcApiConfig,
};
