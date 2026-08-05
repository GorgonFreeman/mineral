// https://linear.app/developers/graphql

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['input', valueProvided],
]);

const linearProjectCreate = async (
  credsPayload,
  input,
  {
    aiConversationId,
    projectDraftId,
    slackChannelName,
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    input,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      body: {
        query: `
          mutation ProjectCreate(
            $input: ProjectCreateInput!
            $aiConversationId: String
            $projectDraftId: String
            $slackChannelName: String
          ) {
            projectCreate(
              input: $input
              aiConversationId: $aiConversationId
              projectDraftId: $projectDraftId
              slackChannelName: $slackChannelName
            ) {
              success
              project {
                id
                name
                url
              }
            }
          }
        `,
        variables: {
          input,
          aiConversationId,
          projectDraftId,
          slackChannelName,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.projectCreate',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearProjectCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearProjectCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "input": {
      "name": "Example project",
      "teamIds": ["f2387dcd-61ac-49aa-8d7a-7f62a0b5cca0"]
    }
  }'
*/
