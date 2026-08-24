// https://developers.figma.com/docs/rest-api/dev-resources-endpoints/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { figmaClient } = require('../figma/figma.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['devResourcesPayload', Boolean],
]);

const figmaDevResourcesUpdate = async (
  credsPayload,
  devResourcesPayload,
  {
    params,
    fetchClient = figmaClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    devResourcesPayload
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/dev_resources`,
      body: devResourcesPayload,
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
  figmaDevResourcesUpdate,
  funcApiConfig,
};
