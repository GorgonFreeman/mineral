// https://docs.snowflake.com/en/sql-reference/sql/show-warehouses

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { snowflakeQuery } = require('../snowflake/snowflakeQuery');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const snowflakeWarehousesGet = async (
  credsPayload,
  {
    like,
    fetchClient,
    ...queryOptions
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const statement = like
    ? `show warehouses like '${ String(like).replace(/'/g, "''") }'`
    : 'show warehouses';

  return snowflakeQuery(credsPayload, statement, {
    fetchClient,
    ...queryOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  snowflakeWarehousesGet,
  funcApiConfig,
};
