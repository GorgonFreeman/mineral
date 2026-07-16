const { createClient } = require('@supabase/supabase-js');
const { HOSTED } = require('../constants');
const { credsFromPayload } = require('../utils');

const SUPABASE_INSTANCES = new Map();

const getSupabaseCacheKey = (credsPayload) => JSON.stringify(credsPayload);

const getSupabaseClient = async (credsPayload) => {
  const key = getSupabaseCacheKey(credsPayload);

  if (SUPABASE_INSTANCES.has(key)) {
    return SUPABASE_INSTANCES.get(key);
  }

  const creds = await credsFromPayload(credsPayload);
  const {
    BASE_URL,
    API_KEY,
  } = creds;

  if (!BASE_URL || !API_KEY) {
    throw new Error('Missing Supabase creds');
  }

  const client = createClient(BASE_URL, API_KEY);
  SUPABASE_INSTANCES.set(key, client);
  return client;
};

const supabaseInterpreter = (response) => {
  const { data, error } = response;

  if (error) {
    return {
      ok: false,
      error: {
        details: error,
      },
    };
  }

  return {
    ok: true,
    data,
  };
};

module.exports = {
  getSupabaseClient,
  supabaseInterpreter,
};
