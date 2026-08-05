// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearViewerGet = async (
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
          query ViewerGet {
            viewer {
              id
              name
              displayName
              email
              active
            }
          }
        `,
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.viewer',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearViewerGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearViewerGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" }
  }'
*/
