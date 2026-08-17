// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['teamId'],
]);

const linearTeamGet = async (
  credsPayload,
  teamId,
  {
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    teamId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      body: {
        query: `
          query TeamGet($teamId: String!) {
            team(id: $teamId) {
              id
              name
              key
              description
            }
          }
        `,
        variables: {
          teamId,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.team',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearTeamGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearTeamGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "teamId": "f2387dcd-61ac-49aa-8d7a-7f62a0b5cca0"
  }'
*/
