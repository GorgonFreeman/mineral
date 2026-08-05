// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['id'],
]);

const linearCommentGet = async (
  credsPayload,
  id,
  {
    hash,
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
          query CommentGet($id: String!, $hash: String) {
            comment(id: $id, hash: $hash) {
              id
              body
              createdAt
              updatedAt
              user {
                id
                name
              }
            }
          }
        `,
        variables: {
          id,
          hash,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.comment',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearCommentGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearCommentGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "id": "COMMENT_ID"
  }'
*/
