// https://linear.app/developers/graphql

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['input', valueProvided],
]);

const linearWebhookCreate = async (
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
          mutation WebhookCreate($input: WebhookCreateInput!) {
            webhookCreate(input: $input) {
              success
              webhook {
                id
                url
                enabled
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
      resultPath: 'data.webhookCreate',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearWebhookCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearWebhookCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "input": {
      "url": "https://example.com/hooks/linear",
      "teamId": "f2387dcd-61ac-49aa-8d7a-7f62a0b5cca0",
      "resourceTypes": ["Issue"]
    }
  }'
*/
