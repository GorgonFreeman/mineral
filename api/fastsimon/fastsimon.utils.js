// https://docs.fastsimon.com/api/api-doc.html

const { BASE_URL } = require('../fastsimon/fastsimon.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
  appendUrlToBase,
} = require('../utils');

const sessionCacheKeyForCredsPayload = (credsPayload) => {
  if (credsPayload?.credsPath) {
    return credsPayload.credsPath;
  }

  return JSON.stringify(credsPayload);
};

// cdn_cache_key is required on product endpoints and is obtained from /load.
// Cache per creds identity so repeated searches in the same process reuse it.
const cdnCacheKeyByCredsKey = new Map();

const useUrlAndAuthQuery = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const {
    UUID,
    STORE_ID,
  } = creds ?? {};

  if (!UUID || !STORE_ID) {
    return {
      response: {
        ok: false,
        error: {
          code: 'MISSING_FASTSIMON_CREDS',
          message: 'fastsimon creds require UUID and STORE_ID',
        },
      },
      breakChain: true,
    };
  }

  const query = {
    UUID,
    store_id: STORE_ID,
    ...(requestPayload.query || {}),
  };

  // Prefer an explicitly provided cdn_cache_key (e.g. from options),
  // otherwise inject a previously cached one if present.
  const cacheKey = sessionCacheKeyForCredsPayload(context.credsPayload || {});
  if (!query.cdn_cache_key && cdnCacheKeyByCredsKey.has(cacheKey)) {
    query.cdn_cache_key = cdnCacheKeyByCredsKey.get(cacheKey);
  }

  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    // narrow is documented as a JSON-encoded list of tuples; stringify objects/arrays
    if (typeof value === 'object') {
      searchParams.append(key, JSON.stringify(value));
    } else {
      searchParams.append(key, String(value));
    }
  });

  const path = requestPayload.url || '';
  const url = `${ appendUrlToBase(BASE_URL, path) }?${ searchParams.toString() }`;

  return {
    requestPayload: {
      ...requestPayload,
      url,
      headers: {
        Accept: 'application/json',
        ...requestPayload.headers,
      },
    },
  };
};

const rememberCdnCacheKey = async (state) => {
  const { response, context } = state;
  if (!response?.ok || !response?.data) {
    return {};
  }

  const cdnCacheKey =
    response.data.cdn_cache_key ||
    response.data.cdnCacheKey;

  if (!cdnCacheKey) {
    return {};
  }

  const cacheKey = sessionCacheKeyForCredsPayload(context.credsPayload || {});
  cdnCacheKeyByCredsKey.set(cacheKey, cdnCacheKey);

  return {};
};

const fastsimonClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndAuthQuery,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    rememberCdnCacheKey,
  ],
});

/**
 * Fetch (and cache) the current CDN cache key via GET /load.
 * Safe to call repeatedly; subsequent calls hit the in-memory cache.
 */
const ensureCdnCacheKey = async (credsPayload, { fetchClient = fastsimonClient } = {}) => {
  const cacheKey = sessionCacheKeyForCredsPayload(credsPayload);
  if (cdnCacheKeyByCredsKey.has(cacheKey)) {
    return {
      ok: true,
      data: { cdn_cache_key: cdnCacheKeyByCredsKey.get(cacheKey) },
    };
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/load',
      query: {},
    },
    context: {
      credsPayload,
    },
  });

  if (!response?.ok) {
    return response;
  }

  const cdnCacheKey =
    response.data?.cdn_cache_key ||
    response.data?.cdnCacheKey;

  if (!cdnCacheKey) {
    return {
      ok: false,
      error: {
        code: 'CDN_CACHE_KEY_MISSING',
        message: 'GET /load succeeded but no cdn_cache_key was present in the response',
        details: response.data,
      },
    };
  }

  cdnCacheKeyByCredsKey.set(cacheKey, cdnCacheKey);

  return {
    ok: true,
    data: { cdn_cache_key: cdnCacheKey },
  };
};

module.exports = {
  fastsimonClient,
  ensureCdnCacheKey,
  // exposed for tests / manual cache control
  cdnCacheKeyByCredsKey,
};
