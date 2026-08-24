// https://developers.figma.com/docs/rest-api/webhooks-endpoints/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { figmaClient } = require('../figma/figma.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['webhookPayload', Boolean],
]);

const figmaWebhookCreate = async (
  credsPayload,
  webhookPayload,
  {
    params,
    fetchClient = figmaClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    webhookPayload
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/v2/webhooks`,
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
  figmaWebhookCreate,
  funcApiConfig,
};
