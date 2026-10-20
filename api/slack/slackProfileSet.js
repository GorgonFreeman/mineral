// https://docs.slack.dev/reference/methods/users.profile.set

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { slackClient } = require('../slack/slack.utils');

const profileValidator = (profile) => {
  return Boolean(profile && typeof profile === 'object' && Object.keys(profile).length);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['profile', profileValidator],
]);

const slackProfileSet = async (
  credsPayload,
  profile,
  {
    user,
    useTokenType = 'user',
    inspect = false,
    fetchClient = slackClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    profile,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      url: '/users.profile.set',
      method: 'post',
      body: {
        profile,
        ...user && { user },
      },
    },
    context: {
      credsPayload,
      useTokenType,
    },
    inspect,
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  slackProfileSet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/slackProfileSet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "slack" },
    "profile": {
      "status_text": "Soz! I'\''m away - Slack Ben c:",
      "status_emoji": ":palm_tree:",
      "status_expiration": 1763568000
    },
    "options": {
      "useTokenType": "user"
    }
  }'
*/
