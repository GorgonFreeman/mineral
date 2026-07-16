const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getSupabaseClient, supabaseInterpreter } = require('../supabase/supabase.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['tableName'],
  ['match'],
  ['updatePayload'],
]);

const supabaseRowUpdate = async (
  credsPayload,
  tableName,
  match,
  updatePayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    tableName,
    match,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const client = await getSupabaseClient(credsPayload);
  const response = await client
    .from(tableName)
    .update(updatePayload)
    .match(match)
    .select()
  ;

  return supabaseInterpreter(response);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  supabaseRowUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/supabaseRowUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "supabase.mushroom_kingdom" },
    "tableName": "powerups",
    "match": { "name": "star" },
    "updatePayload": { "duration_seconds": 12 }
  }'
*/
