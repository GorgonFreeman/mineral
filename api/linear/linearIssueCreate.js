// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const issuePayloadValidator = (issuePayload) => (
  Boolean(issuePayload?.title && issuePayload?.teamId)
);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['issuePayload', issuePayloadValidator],
]);

const linearIssueCreate = async (
  credsPayload,
  issuePayload,
  {
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    issuePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return linearClient.fetch({
    requestPayload: {
      body: {
        query: `
        mutation IssueCreate($input: IssueCreateInput!) {
          issueCreate(input: $input) {
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
          input: issuePayload,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.issueCreate.issue',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearIssueCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearIssueCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "issuePayload": {
      "title": "Example issue",
      "teamId": "f2387dcd-61ac-49aa-8d7a-7f62a0b5cca0"
    }
  }'
*/
