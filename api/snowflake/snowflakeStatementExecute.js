// https://docs.snowflake.com/en/developer-guide/sql-api/submitting-requests

const { randomUUID } = require('crypto');

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const {
  snowflakeClient,
  sessionContextFromCreds,
} = require('../snowflake/snowflake.utils');
const {
  SQL_API_PATH,
  DEFAULT_STATEMENT_TIMEOUT_SECONDS,
} = require('../snowflake/snowflake.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['statement'],
]);

const snowflakeStatementExecute = async (
  credsPayload,
  statement,
  {
    timeout = DEFAULT_STATEMENT_TIMEOUT_SECONDS,
    database,
    schema,
    warehouse,
    role,
    bindings,
    parameters,
    async: asAsync = false,
    nullable,
    requestId,
    fetchClient = snowflakeClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    statement,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  // resolveCreds runs in the client; session defaults come from creds when present.
  const { credsFromPayload } = require('../utils');
  const creds = await credsFromPayload(credsPayload);

  const body = {
    statement,
    timeout,
    ...sessionContextFromCreds(creds, {
      database,
      schema,
      warehouse,
      role,
    }),
    ...(bindings !== undefined && { bindings }),
    ...(parameters !== undefined && { parameters }),
  };

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: SQL_API_PATH,
      params: {
        requestId: requestId || randomUUID(),
        ...(asAsync ? { async: true } : {}),
        ...(nullable !== undefined && { nullable }),
      },
      body,
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

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  snowflakeStatementExecute,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/snowflakeStatementExecute" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "snowflake" },
    "statement": "select current_version() as version"
  }'
*/
