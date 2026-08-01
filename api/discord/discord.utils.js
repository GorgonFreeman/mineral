const { DISCORD_API_BASE_URL } = require('../discord/discord.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { BOT_TOKEN } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Authorization: `Bot ${ BOT_TOKEN }`,
        ...requestPayload.headers,
      },
    },
  };
};

const discordClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(DISCORD_API_BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  discordClient,
};
