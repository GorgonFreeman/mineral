// https://tagalys.notion.site/Storefront-API-v2-20eacdd38c2080d58d3fd0cf6f24e435

const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

// Recursively flattens nested params into Rails/PHP-style bracket query
// params, e.g. { filter: { color: ['red'] } } -> filter[color][]=red
// and { filter: { price: { selected_min: 100 } } } -> filter[price][selected_min]=100
// This also covers the search_suggestions `sections[section_id][*]` shape,
// e.g. { sections: { products: { count: 6 } } } -> sections[products][count]=6
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

// Request context (country, language, segmentTag) is supported by the
// collections, search and recommendations endpoints per the docs. Callers
// pass these via `context` (like `apiVersion` in the shopify client),
// rather than merging them into `query` themselves, so the shared client
// applies them consistently across every endpoint that uses it.
const useRequestContextParams = async (state) => {
  const { requestPayload, context } = state;
  const { country, language, segmentTag } = context;

  if (!country && !language && !segmentTag) {
    return {};
  }

  return {
    requestPayload: {
      ...requestPayload,
      query: {
        ...requestPayload.query,
        ...(country ? { country } : {}),
        ...(language ? { language } : {}),
        ...(segmentTag ? { segment_tag: segmentTag } : {}),
      },
    },
  };
};

// Base URL is region-specific per account (e.g. https://api-r1.tagalys.com),
// so per AGENTS.md it's resolved from creds rather than tagalys.constants.js.
const useUrlAndQuery = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;

  const {
    BASE_URL,
    STORE_HANDLE,
    STOREFRONT_API_KEY,
  } = creds;

  const searchParams = new URLSearchParams();
  searchParams.append('shop_id', `${ STORE_HANDLE }.myshopify.com`);
  if (STOREFRONT_API_KEY) {
    // NOTE: the published docs call this param `storefront_api_key`, but a
    // live request with that name returned `api_key_invalid`. `api_key`
    // is what actually authenticates -- trusting the working behaviour
    // over the doc text here. Revisit if Tagalys ships the documented name.
    searchParams.append('api_key', STOREFRONT_API_KEY);
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

// A configured redirect takes precedence over the rest of the response --
// surface it plainly rather than making callers dig for it. Only /v2/search
// and /v2/search_suggestions ever populate `redirect_url`, so this is a
// no-op for every other endpoint on the shared client.
const useRedirectResponse = async (state) => {
  const { response } = state;

  if (!response?.ok || !response?.data?.redirect_url) {
    return {};
  }

  return {
    response: {
      redirected: true,
      redirectUrl: response.data.redirect_url,
    },
  };
};

const tagalysClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useRequestContextParams,
    useUrlAndQuery,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    useRedirectResponse,
  ],
});

module.exports = {
  tagalysClient,
  appendParams,
};
