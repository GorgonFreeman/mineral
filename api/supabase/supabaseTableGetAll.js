const { HOSTED } = require('../constants');
const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getSupabaseClient } = require('../supabase/supabase.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['tableName'],
]);

const supabaseTableGetAll = async (
  credsPayload,
  tableName,
  {
    orderBy = 'id',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    tableName,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const client = await getSupabaseClient(credsPayload);

  const rowsCountResponse = await client.from(tableName).select('*', { count: 'exact', head: true });
  const { count: rowsCount } = rowsCountResponse;

  const PAGE_SIZE = 1000;
  let rowsFetched = 0;
  let rows = [];

  while (rowsFetched < rowsCount) {
    const pageRowsResponse = await client
      .from(tableName)
      .select('*')
      .order(orderBy)
      .range(rowsFetched, (rowsFetched + PAGE_SIZE) - 1)
    ;
    const { data, error } = pageRowsResponse;

    if (error) {
      return {
        ok: false,
        error: {
          message: error.message,
        },
      };
    }

    if (!data) {
      break;
    }

    rows.push(...data);
    rowsFetched += PAGE_SIZE;
    !HOSTED && console.log(`${ rows.length } / ${ rowsCount }`);
  }

  return {
    ok: true,
    data: rows,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  supabaseTableGetAll,
  funcApiConfig,
};
