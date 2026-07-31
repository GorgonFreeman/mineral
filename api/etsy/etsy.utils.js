const { BASE_URL } = require('../etsy/etsy.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const { resolveFromCreds, FetchClient, fetchClientCommonSteps } = require('../utils');

const useEtsyBaseUrl = async (state) => {
  const { creds } = state.context;
  return useBaseUrl(creds.BASE_URL ?? BASE_URL)(state);
};

const useEtsyApiKeyHeader = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const {
    API_KEY,
    SHARED_SECRET,
  } = creds;

  if (!API_KEY || !SHARED_SECRET) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'INVALID_CREDS',
          message: 'API_KEY and SHARED_SECRET are required.',
        },
      },
    };
  }

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        'x-api-key': `${ API_KEY }:${ SHARED_SECRET }`,
        ...requestPayload.headers,
      },
    },
  };
};

// TODO: Refresh when access token is expired.
const tokensFromCredsIfNotContext = async (state) => {
  const { context } = state;
  const {
    withBearer,
    accessToken,
    refreshToken,
    creds,
  } = context;

  if (!withBearer) {
    return {};
  }

  const contextPatch = {};

  const { 
    ACCESS_TOKEN,
    REFRESH_TOKEN,
  } = creds;

  if (!accessToken && ACCESS_TOKEN) {
    contextPatch.accessToken = ACCESS_TOKEN;
  }

  if (!refreshToken && REFRESH_TOKEN) {
    contextPatch.refreshToken = REFRESH_TOKEN;
  }

  return {
    context: {
      ...context,
      ...contextPatch,
    },
  };
};

const useEtsyBearerFromContext = async (state) => {
  const { requestPayload, context } = state;
  const { withBearer, accessToken } = context;

  if (!withBearer) {
    return {};
  }

  if (!accessToken) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'NO_ACCESS_TOKEN',
          message: 'context.accessToken is required when withBearer is true.',
        },
      },
    };
  }

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Authorization: `Bearer ${ accessToken }`,
        ...requestPayload.headers,
      },
    },
  };
};

const etsyClient = new FetchClient({
  pipeline: [
    resolveCreds,
    tokensFromCredsIfNotContext,
    useEtsyBaseUrl,
    useEtsyApiKeyHeader,
    useEtsyBearerFromContext,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

const fetchWithoutTokenRefresh = etsyClient.fetch.bind(etsyClient);

const etsyAccessTokenExpired = (response) => {
  const details = response?.error?.details;

  return details?.error === 'invalid_token'
    && details?.error_description === 'access token is expired';
};

// TODO: In-memory session map for access/refresh tokens per credsPath.
etsyClient.fetch = async ({
  requestPayload,
  context = {},
  inspect = false,
}) => {
  const response = await fetchWithoutTokenRefresh({
    requestPayload,
    context,
    inspect,
  });

  if (
    !context.withBearer
    || response.ok
    || !etsyAccessTokenExpired(response)
    || context.etsyRetriedAfterTokenRefresh
  ) {
    return response;
  }

  const { etsyAccessTokenRefresh } = require('./etsyAccessTokenRefresh');
  const refreshResponse = await etsyAccessTokenRefresh(context.credsPayload);

  if (!refreshResponse.ok) {
    return refreshResponse;
  }

  const { accessToken, refreshToken } = refreshResponse.data;

  return fetchWithoutTokenRefresh({
    requestPayload,
    inspect,
    context: {
      ...context,
      accessToken,
      refreshToken,
      etsyRetriedAfterTokenRefresh: true,
    },
  });
};

const resolveShopIdFromCreds = async ({ shopId, credsPayload }) => {
  if (shopId) {
    return { ok: true, data: shopId };
  }
  return resolveFromCreds('SHOP_ID')({ credsPayload });
};

module.exports = {
  etsyClient,
  fetchWithoutTokenRefresh,
  resolveShopIdFromCreds,
};
