const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  customFetch,
  fetchClientCommonSteps,
} = require('../utils');
const {
  FEDEX_LIVE_BASE_URL,
  FEDEX_OAUTH_PATH,
  FEDEX_SANDBOX_BASE_URL,
} = require('./fedex.constants');

const accessTokenCache = new Map();

const isSandboxCreds = (creds) => {
  return creds?.SANDBOX === true
    || creds?.SANDBOX === 'true'
    || creds?.ENVIRONMENT === 'sandbox';
};

const baseUrlForCreds = (creds) => {
  return (creds?.BASE_URL || (
    isSandboxCreds(creds)
      ? FEDEX_SANDBOX_BASE_URL
      : FEDEX_LIVE_BASE_URL
  )).replace(/\/$/, '');
};

const getAccessToken = async (creds) => {
  if (creds?.ACCESS_TOKEN) {
    return creds.ACCESS_TOKEN;
  }

  const {
    CLIENT_ID,
    CLIENT_SECRET,
  } = creds || {};
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      'FedEx creds require ACCESS_TOKEN or CLIENT_ID and CLIENT_SECRET',
    );
  }

  const cacheKey = `${ baseUrlForCreds(creds) }:${ CLIENT_ID }`;
  const cachedToken = accessTokenCache.get(cacheKey);
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const basicAuth = Buffer
    .from(`${ CLIENT_ID }:${ CLIENT_SECRET }`)
    .toString('base64');
  const response = await customFetch(
    appendUrlToBase(baseUrlForCreds(creds), FEDEX_OAUTH_PATH),
    {
      method: 'post',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${ basicAuth }`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    },
  );

  if (!response.ok) {
    throw new Error(
      `FedEx authentication failed: ${ JSON.stringify(response.error || response.data) }`,
    );
  }

  const {
    access_token: accessToken,
    expires_in: expiresIn = 3600,
  } = response.data || {};
  if (!accessToken) {
    throw new Error('FedEx authentication response missing access_token');
  }

  accessTokenCache.set(cacheKey, {
    accessToken,
    expiresAt: Date.now() + (Math.max(expiresIn - 60, 60) * 1000),
  });

  return accessToken;
};

const useBaseUrlFromCreds = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(
        baseUrlForCreds(creds),
        requestPayload.url || '',
      ),
    },
  };
};

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;

  let accessToken;
  try {
    accessToken = await getAccessToken(creds);
  } catch (error) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'FEDEX_AUTH_ERROR',
          message: error.message,
        },
      },
    };
  }

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${ accessToken }`,
        ...requestPayload.headers,
      },
    },
  };
};

const fedexClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrlFromCreds,
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  accessTokenCache,
  baseUrlForCreds,
  fedexClient,
  getAccessToken,
};
