// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference/event-table

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
  ['databaseName'],
  ['schemaName'],
]);

const snowflakeEventTablesGetImpl = async (
  returnGetter,
  credsPayload,
  databaseName,
  schemaName,
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
    databaseName,
    schemaName,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const method = returnGetter ? snowflakeGetter : snowflakeGet;

  return method(
    credsPayload,
    `/api/${ apiVersion }/databases/${ databaseName }/schemas/${ schemaName }/event-tables`,
    {
      params: {
        ...(like !== undefined && { like }),
        ...(startsWith !== undefined && { startsWith }),
        ...(history !== undefined && { history }),
        ...(fromName !== undefined && { fromName }),
      },
      showLimit,
      fetchClient,
      ...getterOptions,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  snowflakeEventTablesGet: (...args) => snowflakeEventTablesGetImpl(false, ...args),
  snowflakeEventTablesGetter: (...args) => snowflakeEventTablesGetImpl(true, ...args),
  funcApiConfig,
};
