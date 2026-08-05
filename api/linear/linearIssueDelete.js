// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['id'],
]);

const linearIssueDelete = async (
  credsPayload,
  id,
  {
    permanentlyDelete,
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
          mutation IssueDelete($id: String!, $permanentlyDelete: Boolean) {
            issueDelete(id: $id, permanentlyDelete: $permanentlyDelete) {
              success
              entity {
                id
                identifier
              }
            }
          }
        `,
        variables: {
          id,
          permanentlyDelete,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.issueDelete',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearIssueDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearIssueDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "id": "WHI-267"
  }'
*/
