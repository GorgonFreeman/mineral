const { SLACK_API_BASE_URL } = require('../slack/slack.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const TOKEN_KEYS_BY_TYPE = {
  bot: 'BOT_TOKEN',
  user: 'USER_TOKEN',
};

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const useTokenType = context.useTokenType || 'bot';
  const tokenKey = TOKEN_KEYS_BY_TYPE[useTokenType];

  if (!tokenKey) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'INVALID_USE_TOKEN_TYPE',
          message: `useTokenType must be 'bot' or 'user', got '${ useTokenType }'`,
        },
      },
    };
  }

  const token = creds?.[tokenKey];
  if (!token) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'NO_SLACK_TOKEN',
          message: `slack creds missing ${ tokenKey }`,
        },
      },
    };
  }

  return {
    requestPayload: {
      ...requestPayload,
      method: requestPayload.method || 'post',
      headers: {
        Authorization: `Bearer ${ token }`,
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
  TOKEN_KEYS_BY_TYPE,
};
