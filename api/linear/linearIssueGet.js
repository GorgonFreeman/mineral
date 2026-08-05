// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['id'],
]);

const linearIssueGet = async (
  credsPayload,
  id,
  {
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    id,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      body: {
        query: `
          query IssueGet($id: String!) {
            issue(id: $id) {
              id
              identifier
              title
              description
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
        `,
        variables: {
          id,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.issue',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearIssueGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearIssueGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "id": "WHI-267"
  }'
*/
