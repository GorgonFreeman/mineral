// https://linear.app/developers/graphql

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['id'],
  ['input'],
]);

const linearProjectUpdate = async (
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
          mutation ProjectUpdate($id: String!, $input: ProjectUpdateInput!) {
            projectUpdate(id: $id, input: $input) {
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
          id,
          input,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.projectUpdate',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearProjectUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearProjectUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "id": "PROJECT_ID",
    "input": {
      "name": "Updated project"
    }
  }'
*/
