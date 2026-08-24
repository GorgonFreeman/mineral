// https://linear.app/developers/graphql

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['input'],
]);

const linearIssueLabelCreate = async (
  credsPayload,
  input,
  {
    replaceTeamLabels,
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
          mutation IssueLabelCreate(
            $input: IssueLabelCreateInput!
            $replaceTeamLabels: Boolean
          ) {
            issueLabelCreate(input: $input, replaceTeamLabels: $replaceTeamLabels) {
              success
              issueLabel {
                id
                name
                color
              }
            }
          }
        `,
        variables: {
          input,
          replaceTeamLabels,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.issueLabelCreate',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearIssueLabelCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearIssueLabelCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "input": {
      "name": "bug",
      "teamId": "f2387dcd-61ac-49aa-8d7a-7f62a0b5cca0"
    }
  }'
*/
