// https://tagalys.notion.site/Storefront-API-v2-20eacdd38c2080d58d3fd0cf6f24e435

const { credsValidator } = require('../validators');
const { ArgsWarden, logDeep } = require('../utils');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

// NOTE: the Storefront API v2 docs authenticate with `shop_id` (the
// Shopify myshopify.com domain) + an optional `storefront_api_key`, and
// don't mention a client_code param on this endpoint at all -- that's a
// holdover from Tagalys' older v1 API. Mapped below as best guess:
//   BASE_URL   -> used directly (docs say it's region-specific,
//                 e.g. https://api-r1.tagalys.com -- assumed already
//                 resolved to the right region in the creds store)
//   STORE_ID   -> sent as `shop_id`
//   API_KEY    -> sent as `storefront_api_key`
//   CLIENT_CODE -> not used by /v2/search per the docs; left unused below.
//                  Flag if your account actually needs it sent somewhere.
const DEFAULT_INCLUDE = ['products', 'total_count'];

// Recursively flattens nested params into Rails/PHP-style bracket query
// params, e.g. { filter: { color: ['red'] } } -> filter[color][]=red
// and { filter: { price: { selected_min: 100 } } } -> filter[price][selected_min]=100
const appendParams = (searchParams, key, value) => {
  if (value === undefined || value === null) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => appendParams(searchParams, `${ key }[]`, item));
  } else if (typeof value === 'object') {
    Object.entries(value).forEach(([subKey, subValue]) => {
      appendParams(searchParams, `${ key }[${ subKey }]`, subValue);
    });
  } else {
    searchParams.append(key, value);
  }
};

const useUrlAndQuery = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;

  const {
    BASE_URL,
    STORE_ID,
    API_KEY,
  } = creds;

  const searchParams = new URLSearchParams();
  searchParams.append('shop_id', STORE_ID);
  if (API_KEY) {
    searchParams.append('storefront_api_key', API_KEY);
  }
  Object.entries(requestPayload.query || {}).forEach(([key, value]) => {
    appendParams(searchParams, key, value);
  });

  return {
    requestPayload: {
      ...requestPayload,
      url: `${ BASE_URL }${ requestPayload.url }?${ searchParams.toString() }`,
      headers: {
        Accept: 'application/json',
        ...requestPayload.headers,
      },
    },
  };
};

const tagalysClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndQuery,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
]);

const tagalysSearch = async (
  credsPayload,
  query,
  {
    include = DEFAULT_INCLUDE, // e.g. ['products', 'filters', 'sort_options', 'total_count']
    filter, // e.g. { color: ['red'], price: { selected_min: 100, selected_max: 200 } }
    scope, // e.g. { gender: ['female'] }
    sort, // e.g. 'price-asc'
    page,
    perPage,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await tagalysClient.fetch({
    context: {
      credsPayload,
    },
    requestPayload: {
      url: '/v2/search',
      method: 'get',
      query: {
        query,
        include,
        ...(filter ? { filter } : {}),
        ...(scope ? { scope } : {}),
        ...(sort ? { sort } : {}),
        ...(page ? { page } : {}),
        ...(perPage ? { per_page: perPage } : {}),
      },
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  // A configured redirect takes precedence over the rest of the response --
  // surface it plainly rather than making callers dig for it.
  if (data.redirect_url) {
    return { ok: true, redirected: true, redirectUrl: data.redirect_url, data };
  }

  return { ok: true, data };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  tagalysSearch,
  tagalysClient,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/tagalysSearch" \
-d '{ "credsPayload": { "credsPath": "tagalys.au" }, "query": "gold" }'
*/
