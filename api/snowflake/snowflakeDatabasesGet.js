// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference/database

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

const snowflakeDatabasesGetImpl = async (
  returnGetter,
  credsPayload,
  {
    like,
    startsWith,
    history,
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

  return method(credsPayload, `/api/${ apiVersion }/databases`, {
    params: {
      ...(like !== undefined && { like }),
      ...(startsWith !== undefined && { startsWith }),
      ...(history !== undefined && { history }),
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
  snowflakeDatabasesGet: (...args) => snowflakeDatabasesGetImpl(false, ...args),
  snowflakeDatabasesGetter: (...args) => snowflakeDatabasesGetImpl(true, ...args),
  funcApiConfig,
};
