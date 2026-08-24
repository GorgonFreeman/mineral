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

const normaliseLoadData = (data) => {
  if (data == null) {
    return {};
  }
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
};

const pickCdnCacheKey = (data) => {
  const body = normaliseLoadData(data);
  return (
    body.cdn_cache_key ??
    body.cdnCacheKey ??
    body.cache_key ??
    body.cacheKey ??
    null
  );
};

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

  const cdnCacheKey = pickCdnCacheKey(response.data);
  if (cdnCacheKey == null) {
    return {};
  }

  const cacheKey = sessionCacheKeyForCredsPayload(context.credsPayload || {});
  cdnCacheKeyByCredsKey.set(cacheKey, cdnCacheKey);

  return {};
};

/**
 * Fast Simon often returns the body as a JSON string. Parse it, then for
 * product payloads dig `items` into `data` and move everything else to `meta`
 * (total_results, term, facets, page info, uuid, etc.).
 */
const normaliseSearchResponse = async (state) => {
  const { response } = state;
  if (!response?.ok || response.data == null) {
    return {};
  }

  let body = response.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return {};
    }
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      response: {
        data: body,
      },
    };
  }

  if (!Object.prototype.hasOwnProperty.call(body, 'items')) {
    return {
      response: {
        data: body,
      },
    };
  }

  const { items, ...rest } = body;

  return {
    response: {
      data: items,
      meta: {
        ...(response.meta || {}),
        ...rest,
      },
    },
  };
};

const fastsimonClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndAuthQuery,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    rememberCdnCacheKey,
    normaliseSearchResponse,
  ],
});

/**
 * Fetch (and cache) the current CDN cache key via GET /load.
 * Safe to call repeatedly; subsequent calls hit the in-memory cache.
 *
 * Some stores' /load payloads omit `cdn_cache_key` even though the OpenAPI
 * marks it required. In that case we fall back to the current Unix epoch
 * (the documented type of the field), which is enough for the search CDN
 * to accept the request.
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

  let cdnCacheKey = pickCdnCacheKey(response.data);

  if (cdnCacheKey == null) {
    // Live /load responses for some stores return theme/config fields but no
    // cdn_cache_key. The field is documented as a Unix epoch integer — using
    // "now" is a safe cache-busting fallback that the Serving API accepts.
    cdnCacheKey = Math.floor(Date.now() / 1000);
  }

  cdnCacheKeyByCredsKey.set(cacheKey, cdnCacheKey);

  return {
    ok: true,
    data: {
      cdn_cache_key: cdnCacheKey,
      // surface whether we synthesised the key, in case callers care
      synthesised: pickCdnCacheKey(response.data) == null,
    },
  };
};

module.exports = {
  fastsimonClient,
  ensureCdnCacheKey,
  // exposed for tests / manual cache control
  cdnCacheKeyByCredsKey,
};
