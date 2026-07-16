// https://supabase.com/docs/reference/javascript/rpc

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getSupabaseClient, supabaseInterpreter } = require('../supabase/supabase.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['rpcName'],
]);

const supabaseRpc = async (
  credsPayload,
  rpcName,
  {
    rpcArgs,
    rpcOptions,
    useMaybeSingle = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    rpcName,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const client = await getSupabaseClient(credsPayload);
  let query = client.rpc(rpcName, rpcArgs, rpcOptions);

  if (useMaybeSingle) {
    query = query.maybeSingle();
  }

  const response = await query;
  return supabaseInterpreter(response);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  supabaseRpc,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/supabaseRpc" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "supabase.mushroom_kingdom" },
    "rpcName": "grant_powerup",
    "options": {
      "rpcArgs": { "player": "mario", "powerup": "1up_mushroom" },
      "useMaybeSingle": true
    }
  }'
*/
