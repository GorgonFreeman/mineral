// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const inputValidator = (input) => Boolean(input?.url);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['input', inputValidator],
]);

const linearEntityExternalLinkCreate = async (
  credsPayload,
  input,
  {
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
          mutation EntityExternalLinkCreate($input: EntityExternalLinkCreateInput!) {
            entityExternalLinkCreate(input: $input) {
              success
              entityExternalLink {
                id
                label
                url
                sortOrder
                createdAt
              }
            }
          }
        `,
        variables: {
          input,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.entityExternalLinkCreate',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearEntityExternalLinkCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearEntityExternalLinkCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "input": {
      "projectId": "64e37bd2-af8c-4142-932a-66441b75311b",
      "url": "https://example.com",
      "label": "Example link"
    }
  }'
*/
