// https://docs.snowflake.com/en/developer-guide/sql-api/handling-responses

const { ArgsWarden, actionSingleOrMultiple, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { snowflakeClient } = require('../snowflake/snowflake.utils');
const { SQL_API_PATH } = require('../snowflake/snowflake.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['statementHandle'],
]);

const snowflakeStatementGetSingle = async (
  credsPayload,
  statementHandle,
  {
    partition,
    fetchClient = snowflakeClient,
  } = {},
) => {
  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'get',
      url: `${ SQL_API_PATH }/${ statementHandle }`,
      params: {
        ...(partition !== undefined && { partition }),
      },
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return {
    ok: true,
    data,
  };
};

const snowflakeStatementGet = async (
  credsPayload,
  statementHandle,
  {
    partition,
    queueRunOptions,
    fetchClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    statementHandle,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    statementHandle,
    snowflakeStatementGetSingle,
    (handleItem) => ({
      args: [credsPayload, handleItem, { partition, fetchClient }],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  snowflakeStatementGet,
  funcApiConfig,
};
