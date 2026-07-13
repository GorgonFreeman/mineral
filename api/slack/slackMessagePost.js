// https://docs.slack.dev/reference/methods/chat.postmessage

const { credsFromPayload, objHasAny, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { slackClient } = require('../slack/slack.utils');

const channelIdentifierValidator = (channelIdentifier) => {
  return objHasAny(channelIdentifier, ['channelName', 'channelId']);
};

const messagePayloadValidator = (messagePayload) => {
  return objHasAny(messagePayload, ['text', 'blocks', 'markdownText']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['channelIdentifier', channelIdentifierValidator],
  ['messagePayload', messagePayloadValidator],
]);

const slackMessagePost = async (
  credsPayload,
  channelIdentifier,
  messagePayload,
  {
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    channelIdentifier,
    messagePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const {
    channelName,
    channelId,
  } = channelIdentifier;

  const {
    text,
    blocks,
    markdownText,
  } = messagePayload;

  const response = await slackClient.fetch({
    url: '/chat.postMessage',
    method: 'post',
    body: {
      channel: channelId || channelName,
      ...text && { text },
      ...blocks && { blocks },
      ...markdownText && { markdown_text: markdownText },
    },
    context: { creds },
    inspect,
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  slackMessagePost,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/slackMessagePost" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "slack" },
    "channelIdentifier": { "channelName": "#hidden_testing" },
    "messagePayload": { "text": "new number, who dis?" }
  }'
*/
