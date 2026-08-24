// https://developers.figma.com/docs/rest-api/dev-resources-endpoints/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { figmaClient } = require('../figma/figma.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fileKey'],
  ['devResourceId'],
]);

const figmaFileDevResourceDelete = async (
  credsPayload,
  fileKey,
  devResourceId,
  {
    params,
    fetchClient = figmaClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fileKey,
    devResourceId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'delete',
      url: `/v1/files/${ fileKey }/dev_resources/${ devResourceId }`,
      
      
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
  figmaFileDevResourceDelete,
  funcApiConfig,
};
