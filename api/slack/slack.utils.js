const { SLACK_API_BASE_URL } = require('../slack/slack.constants');
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
      method: requestPayload.method || 'post',
      headers: {
        Authorization: `Bearer ${ BOT_TOKEN }`,
        ...requestPayload.headers,
      },
    },
  };
};

const slackClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(SLACK_API_BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  slackClient,
};
