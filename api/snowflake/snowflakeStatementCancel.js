// https://docs.snowflake.com/en/developer-guide/sql-api/cancelling-requests

const { ArgsWarden, actionSingleOrMultiple, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { snowflakeClient } = require('../snowflake/snowflake.utils');
const { SQL_API_PATH } = require('../snowflake/snowflake.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['statementHandle'],
]);

const snowflakeStatementCancelSingle = async (
  credsPayload,
  statementHandle,
  {
    fetchClient = snowflakeClient,
  } = {},
) => {
  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: `${ SQL_API_PATH }/${ statementHandle }/cancel`,
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return {
    ok: true,
    data: data ?? null,
  };
};

const snowflakeStatementCancel = async (
  credsPayload,
  statementHandle,
  {
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
    snowflakeStatementCancelSingle,
    (handleItem) => ({
      args: [credsPayload, handleItem, { fetchClient }],
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
  snowflakeStatementCancel,
  funcApiConfig,
};
