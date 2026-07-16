const { HOSTED } = require('../constants');
const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getSupabaseClient, supabaseInterpreter } = require('../supabase/supabase.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['tableName'],
  ['deleteConfig'],
]);

const supabaseRowDelete = async (
  credsPayload,
  tableName,
  deleteConfig,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    tableName,
    deleteConfig,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  if (!deleteConfig || typeof deleteConfig !== 'object') {
    return {
      ok: false,
      error: {
        message: 'deleteConfig must be an object with either { field, value } or { conditions }',
      },
    };
  }

  const client = await getSupabaseClient(credsPayload);
  let queryResponse;

  if (deleteConfig.conditions) {
    if (typeof deleteConfig.conditions !== 'object') {
      return {
        ok: false,
        error: {
          message: 'conditions must be an object with field-value pairs',
        },
      };
    }

    !HOSTED && console.log('Deleting row with conditions:', deleteConfig.conditions);

    let query = client.from(tableName).delete();

    Object.entries(deleteConfig.conditions).forEach(([field, value]) => {
      query = query.eq(field, value);
    });

    queryResponse = await query.select();
  } else if (deleteConfig.field && deleteConfig.value !== undefined) {
    !HOSTED && console.log(`Deleting row where ${ deleteConfig.field } = ${ deleteConfig.value }`);

    queryResponse = await client
      .from(tableName)
      .delete()
      .eq(deleteConfig.field, deleteConfig.value)
      .select();
  } else {
    return {
      ok: false,
      error: {
        message: 'deleteConfig must have either { field, value } or { conditions }',
      },
    };
  }

  return supabaseInterpreter(queryResponse);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  supabaseRowDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/supabaseRowDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "supabase.mushroom_kingdom" },
    "tableName": "powerups",
    "deleteConfig": { "field": "name", "value": "fire_flower" }
  }'
*/
