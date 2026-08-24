// https://linear.app/developers/graphql

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['id'],
  ['input'],
]);

const linearIssueUpdate = async (
  credsPayload,
  id,
  input,
  {
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    id,
    input,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      body: {
        query: `
          mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
            issueUpdate(id: $id, input: $input) {
              success
              issue {
                id
                identifier
                title
                url
                priority
                createdAt
                updatedAt
                state {
                  id
                  name
                }
                team {
                  id
                  name
                }
                assignee {
                  id
                  name
                }
              }
            }
          }
        `,
        variables: {
          id,
          input,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.issueUpdate',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearIssueUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearIssueUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "id": "WHI-267",
    "input": {
      "title": "Updated title"
    }
  }'
*/
