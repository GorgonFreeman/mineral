// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearOrganizationGet = async (
  credsPayload,
  {
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      body: {
        query: `
          query OrganizationGet {
            organization {
              id
              name
              urlKey
              createdAt
            }
          }
        `,
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.organization',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearOrganizationGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearOrganizationGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" }
  }'
*/
