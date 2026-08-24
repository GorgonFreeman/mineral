// https://developers.figma.com/docs/rest-api/comments-endpoints/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { figmaClient } = require('../figma/figma.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fileKey'],
  ['commentId'],
]);

const figmaFileCommentDelete = async (
  credsPayload,
  fileKey,
  commentId,
  {
    params,
    fetchClient = figmaClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fileKey,
    commentId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'delete',
      url: `/v1/files/${ fileKey }/comments/${ commentId }`,
      
      
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
  figmaFileCommentDelete,
  funcApiConfig,
};
