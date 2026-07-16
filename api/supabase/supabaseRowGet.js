const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getSupabaseClient, supabaseInterpreter } = require('../supabase/supabase.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['tableName'],
  ['rowField'],
  ['rowValue'],
]);

const supabaseRowGet = async (
  credsPayload,
  tableName,
  rowField,
  rowValue,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    tableName,
    rowField,
    rowValue,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const client = await getSupabaseClient(credsPayload);
  const response = await client
    .from(tableName)
    .select('*')
    .eq(rowField, rowValue)
    .single()
  ;

  return supabaseInterpreter(response);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  supabaseRowGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/supabaseRowGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "supabase.mushroom_kingdom" },
    "tableName": "powerups",
    "rowField": "name",
    "rowValue": "star"
  }'
*/
