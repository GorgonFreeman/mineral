// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference/api-integration
// Named IntegrationsGet (not ApiIntegrations) to match bedrock / avoid awkward export names.

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const {
  snowflakeGet,
  snowflakeGetter,
} = require('../snowflake/snowflakeGet');
const {
  REST_API_VERSION,
  DEFAULT_SHOW_LIMIT,
} = require('../snowflake/snowflake.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const snowflakeIntegrationsGetImpl = async (
  returnGetter,
  credsPayload,
  {
    like,
    showLimit = DEFAULT_SHOW_LIMIT,
    fromName,
    apiVersion = REST_API_VERSION,
    fetchClient,
    ...getterOptions
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const method = returnGetter ? snowflakeGetter : snowflakeGet;

  return method(credsPayload, `/api/${ apiVersion }/api-integrations`, {
    params: {
      ...(like !== undefined && { like }),
      ...(fromName !== undefined && { fromName }),
    },
    showLimit,
    fetchClient,
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  snowflakeIntegrationsGet: (...args) => snowflakeIntegrationsGetImpl(false, ...args),
  snowflakeIntegrationsGetter: (...args) => snowflakeIntegrationsGetImpl(true, ...args),
  funcApiConfig,
};
