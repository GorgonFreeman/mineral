// https://docs.snowflake.com/en/developer-guide/sql-api/handling-responses
// Convenience: execute SQL, poll until done, optionally fetch all partitions,
// and return rows as objects keyed by column name.

const { ArgsWarden, logDeep, wait } = require('../utils');
const { credsValidator } = require('../validators');
const {
  snowflakeClient,
  mapRows,
} = require('../snowflake/snowflake.utils');
const {
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_POLL_MAX_ATTEMPTS,
} = require('../snowflake/snowflake.constants');
const { snowflakeStatementExecute } = require('../snowflake/snowflakeStatementExecute');
const { snowflakeStatementGet } = require('../snowflake/snowflakeStatementGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['statement'],
]);

const isRunningStatus = (payload) => {
  // 202-style status objects expose statementHandle without resultSetMetaData.data complete.
  if (!payload) {
    return false;
  }
  if (payload.statementStatusUrl && !payload.resultSetMetaData) {
    return true;
  }
  // code 090001 is success; running states use other codes with message.
  const message = (payload.message || '').toLowerCase();
  if (message.includes('asynchronous') || message.includes('in progress')) {
    return true;
  }
  return false;
};

const collectAllPartitions = async (
  credsPayload,
  statementHandle,
  firstResult,
  {
    fetchClient,
  } = {},
) => {
  const partitionInfo = firstResult?.resultSetMetaData?.partitionInfo ?? [];
  const allData = [...(firstResult.data || [])];

  // partition 0 is already in firstResult; fetch 1..n-1
  for (let i = 1; i < partitionInfo.length; i += 1) {
    const partResponse = await snowflakeStatementGet(
      credsPayload,
      statementHandle,
      {
        partition: i,
        fetchClient,
      },
    );
    if (!partResponse.ok) {
      return partResponse;
    }
    allData.push(...(partResponse.data?.data || []));
  }

  return {
    ok: true,
    data: {
      ...firstResult,
      data: allData,
    },
  };
};

const snowflakeQuery = async (
  credsPayload,
  statement,
  {
    timeout,
    database,
    schema,
    warehouse,
    role,
    bindings,
    parameters,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    pollMaxAttempts = DEFAULT_POLL_MAX_ATTEMPTS,
    fetchAllPartitions = true,
    asObjects = true,
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

  let result = await snowflakeStatementExecute(credsPayload, statement, {
    timeout,
    database,
    schema,
    warehouse,
    role,
    bindings,
    parameters,
    fetchClient,
  });

  if (!result.ok) {
    return result;
  }

  let payload = result.data;
  let attempts = 0;

  while (isRunningStatus(payload) && attempts < pollMaxAttempts) {
    const handle = payload.statementHandle;
    if (!handle) {
      return {
        ok: false,
        error: {
          code: 'MISSING_STATEMENT_HANDLE',
          message: 'Async response missing statementHandle',
          details: payload,
        },
      };
    }

    await wait(pollIntervalMs);
    attempts += 1;

    const statusResponse = await snowflakeStatementGet(
      credsPayload,
      handle,
      { fetchClient },
    );

    if (!statusResponse.ok) {
      // 202 may still come back as ok depending on status; if hard failure, return.
      return statusResponse;
    }

    payload = statusResponse.data;
  }

  if (isRunningStatus(payload)) {
    return {
      ok: false,
      error: {
        code: 'STATEMENT_TIMEOUT',
        message: `Statement still running after ${ pollMaxAttempts } polls`,
        details: payload,
      },
    };
  }

  // Query failure bodies often arrive as HTTP 422 already handled by execute/get.
  if (payload?.code && String(payload.code) !== '090001' && payload.sqlState && payload.sqlState !== '00000') {
    // Some error payloads still return 200 with failure markers — rare.
    if (payload.message && !payload.resultSetMetaData) {
      logDeep({ payload });
      return {
        ok: false,
        error: {
          code: payload.code || 'STATEMENT_FAILED',
          message: payload.message,
          details: payload,
        },
      };
    }
  }

  const handle = payload.statementHandle;
  let finalPayload = payload;

  if (fetchAllPartitions && handle) {
    const collected = await collectAllPartitions(
      credsPayload,
      handle,
      payload,
      { fetchClient },
    );
    if (!collected.ok) {
      return collected;
    }
    finalPayload = collected.data;
  }

  const rows = asObjects
    ? mapRows(finalPayload)
    : (finalPayload.data ?? []);

  return {
    ok: true,
    data: rows,
    meta: {
      statementHandle: handle,
      numRows: finalPayload?.resultSetMetaData?.numRows
        ?? rows.length,
      rowType: finalPayload?.resultSetMetaData?.rowType,
      sqlState: finalPayload?.sqlState,
      code: finalPayload?.code,
      message: finalPayload?.message,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  snowflakeQuery,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/snowflakeQuery" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "snowflake" },
    "statement": "select 1 as n, current_timestamp() as ts"
  }'
*/
