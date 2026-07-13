const { SLACK_API_BASE_URL } = require('../slack/slack.constants');
const {
  FetchClient,
  Chain,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

const addUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const {
    BOT_TOKEN,
  } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      method: requestPayload.method || 'post',
      url: appendUrlToBase(SLACK_API_BASE_URL, requestPayload.url),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ BOT_TOKEN }`,
        ...requestPayload.headers,
      },
    },
  };
};


const slackClientRequestPreparer = new Chain([
  addUrlAndAuthHeaders,
]);

const slackClientResponseInterpreter = new Chain([
  fetchClientCommonSteps.exitEarlyOnNotOk,
]);

const slackClient = new FetchClient({
  requestPreparer: slackClientRequestPreparer,
  responseInterpreter: slackClientResponseInterpreter,
});

module.exports = {
  slackClient,
};
