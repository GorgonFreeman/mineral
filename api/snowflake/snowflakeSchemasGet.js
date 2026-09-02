// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference/schema

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
]);

const snowflakeSchemasGetImpl = async (
  returnGetter,
  credsPayload,
  databaseName,
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
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const method = returnGetter ? snowflakeGetter : snowflakeGet;

  return method(
    credsPayload,
    `/api/${ apiVersion }/databases/${ databaseName }/schemas`,
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
  snowflakeSchemasGet: (...args) => snowflakeSchemasGetImpl(false, ...args),
  snowflakeSchemasGetter: (...args) => snowflakeSchemasGetImpl(true, ...args),
  funcApiConfig,
};
