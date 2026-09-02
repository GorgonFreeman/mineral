// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/user

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

const snowflakeUsersGetImpl = async (
  returnGetter,
  credsPayload,
  {
    like,
    startsWith,
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

  return method(credsPayload, `/api/${ apiVersion }/users`, {
    params: {
      ...(like !== undefined && { like }),
      ...(startsWith !== undefined && { startsWith }),
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
  snowflakeUsersGet: (...args) => snowflakeUsersGetImpl(false, ...args),
  snowflakeUsersGetter: (...args) => snowflakeUsersGetImpl(true, ...args),
  funcApiConfig,
};
