// https://developers.figma.com/docs/rest-api/comments-endpoints/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { figmaClient } = require('../figma/figma.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fileKey'],
  ['commentId'],
  ['reactionPayload', Boolean],
]);

const figmaFileCommentReactionCreate = async (
  credsPayload,
  fileKey,
  commentId,
  reactionPayload,
  {
    params,
    fetchClient = figmaClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fileKey,
    commentId,
    reactionPayload
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/files/${ fileKey }/comments/${ commentId }/reactions`,
      body: reactionPayload,
    },
    context: {
      credsPayload,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  figmaFileCommentReactionCreate,
  funcApiConfig,
};
