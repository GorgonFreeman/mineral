// https://linear.app/developers/graphql

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['id'],
  ['input'],
]);

const linearCommentUpdate = async (
  credsPayload,
  id,
  input,
  {
    skipEditedAt,
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
          mutation CommentUpdate(
            $id: String!
            $input: CommentUpdateInput!
            $skipEditedAt: Boolean
          ) {
            commentUpdate(id: $id, input: $input, skipEditedAt: $skipEditedAt) {
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
          id,
          input,
          skipEditedAt,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.commentUpdate',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearCommentUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearCommentUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "id": "COMMENT_ID",
    "input": {
      "body": "Updated"
    }
  }'
*/
