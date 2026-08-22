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

const tagalysClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndQuery,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

// Shared request-context params (country, language, segment_tag), supported
// by the collections, search and recommendations endpoints per the docs.
const requestContextParams = ({
  country,
  language,
  segmentTag,
} = {}) => ({
  ...(country ? { country } : {}),
  ...(language ? { language } : {}),
  ...(segmentTag ? { segment_tag: segmentTag } : {}),
});

// A configured redirect takes precedence over the rest of the response --
// surface it plainly rather than making callers dig for it. Shared by
// /v2/search and /v2/search_suggestions, the two endpoints that support it.
const responseWithRedirect = (data) => {
  if (data?.redirect_url) {
    return { ok: true, redirected: true, redirectUrl: data.redirect_url, data };
  }

  return { ok: true, data };
};

module.exports = {
  tagalysClient,
  appendParams,
  requestContextParams,
  responseWithRedirect,
};
