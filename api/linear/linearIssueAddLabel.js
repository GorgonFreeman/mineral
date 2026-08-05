// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['id'],
  ['labelId'],
]);

const linearIssueAddLabel = async (
  credsPayload,
  id,
  labelId,
  {
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    id,
    labelId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      body: {
        query: `
          mutation IssueAddLabel($id: String!, $labelId: String!) {
            issueAddLabel(id: $id, labelId: $labelId) {
              success
              issue {
                id
                identifier
              }
            }
          }
        `,
        variables: {
          id,
          labelId,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.issueAddLabel',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearIssueAddLabel,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearIssueAddLabel" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "id": "WHI-267",
    "labelId": "LABEL_ID"
  }'
*/
