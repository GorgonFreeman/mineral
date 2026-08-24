// https://linear.app/developers/graphql

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['input'],
]);

const linearAttachmentCreate = async (
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
          mutation AttachmentCreate($input: AttachmentCreateInput!) {
            attachmentCreate(input: $input) {
              success
              attachment {
                id
                title
                url
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
      resultPath: 'data.attachmentCreate',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearAttachmentCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearAttachmentCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "input": {
      "issueId": "WHI-267",
      "url": "https://example.com/file.pdf",
      "title": "File"
    }
  }'
*/
