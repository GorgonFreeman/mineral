// https://developers.figma.com/docs/rest-api/developer-logs-endpoints/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { figmaClient } = require('../figma/figma.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['developerLogsPayload', Boolean],
]);

const figmaDeveloperLogsCreate = async (
  credsPayload,
  developerLogsPayload,
  {
    params,
    fetchClient = figmaClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    developerLogsPayload
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/v1/developer_logs`,
      body: developerLogsPayload,
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
  figmaDeveloperLogsCreate,
  funcApiConfig,
};
