const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getSupabaseClient, supabaseInterpreter } = require('../supabase/supabase.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['tableName'],
  ['rowObject'],
]);

const supabaseRowInsert = async (
  credsPayload,
  tableName,
  rowObject,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    tableName,
    rowObject,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const client = await getSupabaseClient(credsPayload);
  const response = await client
    .from(tableName)
    .insert(rowObject)
    .select()
  ;

  return supabaseInterpreter(response);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  supabaseRowInsert,
  funcApiConfig,
};
