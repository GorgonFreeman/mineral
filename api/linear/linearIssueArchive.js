// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['id'],
]);

const linearIssueArchive = async (
  credsPayload,
  id,
  {
    trash,
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
          mutation IssueArchive($id: String!, $trash: Boolean) {
            issueArchive(id: $id, trash: $trash) {
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
          trash,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.issueArchive',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearIssueArchive,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearIssueArchive" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "id": "WHI-267"
  }'
*/
