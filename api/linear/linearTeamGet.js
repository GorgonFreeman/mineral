// https://linear.app/developers/graphql

const { ArgsWarden, oneFromManyInResponse } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');
const { linearTeamsGet } = require('./linearTeamsGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['teamIdentifier'],
]);

const linearTeamGet = async (
  credsPayload,
  teamIdentifier,
  {
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    teamIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  let {
    teamId,
    teamName,
    teamKey,
  } = teamIdentifier;

  if (!teamId) {
    const teamsGetResponse = await linearTeamsGet(credsPayload);

    if (teamName) {
      const teamResponse = oneFromManyInResponse(teamsGetResponse, 'name', teamName);
      if (teamResponse.ok && teamResponse.data) {
        teamId = teamResponse.data.id;
      }
    }

    if (teamKey) {
      const teamResponse = oneFromManyInResponse(teamsGetResponse, 'key', teamKey);
      if (teamResponse.ok && teamResponse.data) {
        teamId = teamResponse.data.id;
      }
    }
  }
  
  // TODO: This should be ok: true, probably
  if (!teamId) {
    return {
      ok: false,
      data: null,
      meta: {
        message: `No team found with identifier ${ JSON.stringify(teamIdentifier) }`,
      },
    };
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
    "teamIdentifier": { "teamName": "Elite Four" }
  }'
*/
