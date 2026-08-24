// https://developers.figma.com/docs/rest-api/variables-endpoints/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { figmaClient } = require('../figma/figma.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fileKey'],
  ['variablesPayload', Boolean],
]);

const figmaVariablesUpdate = async (
  credsPayload,
  fileKey,
  variablesPayload,
  {
    params,
    fetchClient = figmaClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fileKey,
    variablesPayload
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/files/${ fileKey }/variables`,
      body: variablesPayload,
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
  figmaVariablesUpdate,
  funcApiConfig,
};
