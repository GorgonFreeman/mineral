// https://developers.figma.com/docs/rest-api/webhooks-endpoints/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { figmaClient } = require('../figma/figma.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['webhookId'],
  ['webhookPayload', Boolean],
]);

const figmaWebhookUpdate = async (
  credsPayload,
  webhookId,
  webhookPayload,
  {
    params,
    fetchClient = figmaClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    webhookId,
    webhookPayload
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/v2/webhooks/${ webhookId }`,
      body: webhookPayload,
    },
    context: {
      credsPayload,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  figmaWebhookUpdate,
  funcApiConfig,
};
