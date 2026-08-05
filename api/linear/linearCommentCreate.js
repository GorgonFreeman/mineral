// https://linear.app/developers/graphql

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['input', valueProvided],
]);

const linearCommentCreate = async (
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
          mutation CommentCreate($input: CommentCreateInput!) {
            commentCreate(input: $input) {
              success
              comment {
                id
                body
                createdAt
                updatedAt
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
      resultPath: 'data.commentCreate',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearCommentCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearCommentCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "input": {
      "issueId": "WHI-267",
      "body": "Hello"
    }
  }'
*/
