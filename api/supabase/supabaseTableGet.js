const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getSupabaseClient, supabaseInterpreter } = require('../supabase/supabase.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['tableName'],
]);

const supabaseTableGet = async (
  credsPayload,
  tableName,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    tableName,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const client = await getSupabaseClient(credsPayload);
  const response = await client.from(tableName).select('*');
  return supabaseInterpreter(response);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  supabaseTableGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/supabaseTableGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "supabase.mushroom_kingdom" },
    "tableName": "powerups"
  }'
*/
