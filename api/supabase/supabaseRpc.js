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
