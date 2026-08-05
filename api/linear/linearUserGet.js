// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['id'],
]);

const linearUserGet = async (
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
          query UserGet($id: String!) {
            user(id: $id) {
              id
              name
              displayName
              email
              active
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
      resultPath: 'data.user',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearUserGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearUserGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "id": "b2c2e616-384b-4f0e-afb2-2e50839179e2"
  }'
*/
