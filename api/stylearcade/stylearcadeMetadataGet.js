// https://stylearcade.gitlab.io/api-docs/range-plan

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stylearcadeClient } = require('../stylearcade/stylearcade.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const stylearcadeMetadataGet = async (
  credsPayload,
  options = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  return stylearcadeClient.fetch({
    requestPayload: {
      url: '/metadata',
      ...options.params && { params: options.params },
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
  stylearcadeMetadataGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stylearcadeMetadataGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stylearcade" }
  }'
*/
