// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['id'],
]);

const linearCommentDelete = async (
  credsPayload,
  id,
  {
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
          mutation CommentDelete($id: String!) {
            commentDelete(id: $id) {
              success
            }
          }
        `,
        variables: {
          id,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.commentDelete',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearCommentDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearCommentDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "id": "COMMENT_ID"
  }'
*/
