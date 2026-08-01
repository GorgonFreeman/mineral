const { BASE_URL } = require('../etsy/etsy.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const { resolveFromCreds, FetchClient, fetchClientCommonSteps } = require('../utils');

const etsyAccessTokenExpired = (response) => {
  const details = response?.error?.details;

  return details?.error === 'invalid_token'
    && details?.error_description === 'access token is expired';
};

const withEtsyAuthTokenRefresh = async (fetchPayload, next) => {
  const { context = {} } = fetchPayload;

  if (!context.withAccessToken) {
    return next(fetchPayload);
  }

  const response = await next(fetchPayload);

  if (
    response.ok
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

  return next({
    ...fetchPayload,
    context: {
      ...context,
      accessToken,
      refreshToken,
      etsyRetriedAfterTokenRefresh: true,
    },
  });
};

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

const tokensFromCredsIfNotContext = async (state) => {
  const { context } = state;
  const {
    withAccessToken,
    accessToken,
    refreshToken,
    creds,
  } = context;

  if (!withAccessToken) {
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
  const { withAccessToken, accessToken } = context;

  if (!withAccessToken) {
    return {};
  }

  if (!accessToken) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'NO_ACCESS_TOKEN',
          message: 'context.accessToken is required when withAccessToken is true.',
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

// TODO: In-memory session map for access/refresh tokens per credsPath.
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
  layers: [withEtsyAuthTokenRefresh],
});

const resolveShopId = async ({ shopId, credsPayload }) => {
  if (shopId) {
    return { ok: true, data: shopId };
  }

  const shopIdFromCredsResponse = await resolveFromCreds('SHOP_ID')({ credsPayload });
  if (shopIdFromCredsResponse.ok) {
    return { 
      ok: true, 
      data: shopIdFromCredsResponse.data, 
    };
  }

  const { etsyMeGet } = require('./etsyMeGet');
  const meGetResponse = await etsyMeGet(credsPayload);
  const { ok: meGetOk, data: meGetData } = meGetResponse;
  if (meGetOk) {
    ({ shop_id: shopId } = meGetData);

    if (shopId) {
      return { 
        ok: true, 
        data: shopId, 
      };
    }
  }

  return {
    ok: false,
    error: {
      code: 'NO_SHOP_ID',
      message: 'No shop ID found in creds or me response',
    },
  };
};

module.exports = {
  etsyClient,
  etsyAccessTokenExpired,
  resolveShopId,
};
