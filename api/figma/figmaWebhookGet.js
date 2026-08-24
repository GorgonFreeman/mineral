// https://developers.figma.com/docs/rest-api/webhooks-endpoints/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { figmaClient } = require('../figma/figma.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['webhookId'],
]);

const figmaWebhookGet = async (
  credsPayload,
  webhookId,
  {
    params,
    fetchClient = figmaClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    webhookId
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/v2/webhooks/${ webhookId }`,
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
  figmaWebhookGet,
  funcApiConfig,
};
