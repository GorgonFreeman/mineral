// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearIssuesGet = async (
  credsPayload,
  {
    first = 50,
    teamId,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const filter = teamId
    ? { team: { id: { eq: teamId } } }
    : undefined;

  return linearClient.fetch({
    requestPayload: {
      body: {
        query: `
        query IssuesGet($first: Int!, $filter: IssueFilter) {
          issues(first: $first, filter: $filter) {
            nodes {
              id
              identifier
              title
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
          first,
          ...(filter && { filter }),
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.issues.nodes',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearIssuesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearIssuesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" }
  }'

curl -X POST "http://localhost:8000/linearIssuesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "first": 5
    }
  }'
*/
