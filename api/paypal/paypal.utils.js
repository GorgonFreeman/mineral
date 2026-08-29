// https://developer.paypal.com/api/rest/authentication/

const {
  LIVE_BASE_URL,
  SANDBOX_BASE_URL,
} = require('../paypal/paypal.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
  customFetch,
  appendUrlToBase,
} = require('../utils');

// Cache client-credentials tokens per CLIENT_ID + environment.
const clientCredentialsTokenCache = new Map();

const isSandboxCreds = (creds) => {
  if (creds?.SANDBOX === true || creds?.SANDBOX === 'true') {
    return true;
  }
  if (creds?.ENVIRONMENT === 'sandbox' || creds?.MODE === 'sandbox') {
    return true;
  }
  return false;
};

const baseUrlForCreds = (creds) => {
  if (creds?.BASE_URL) {
    return creds.BASE_URL.replace(/\/$/, '');
  }
  return isSandboxCreds(creds) ? SANDBOX_BASE_URL : LIVE_BASE_URL;
};

const tokenCacheKey = (creds) => {
  const env = isSandboxCreds(creds) ? 'sandbox' : 'live';
  return `${ env }:${ creds?.CLIENT_ID || '' }`;
};

const getClientCredentialsToken = async (creds) => {
  const { CLIENT_ID, CLIENT_SECRET } = creds ?? {};
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('paypal client_credentials require CLIENT_ID and CLIENT_SECRET');
  }

  const cacheKey = tokenCacheKey(creds);
  const cached = clientCredentialsTokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.accessToken;
  }

  const baseUrl = baseUrlForCreds(creds);
  const basic = Buffer
    .from(`${ CLIENT_ID }:${ CLIENT_SECRET }`)
    .toString('base64');

  const response = await customFetch(
    `${ baseUrl }/v1/oauth2/token`,
    {
      method: 'post',
      headers: {
        Authorization: `Basic ${ basic }`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: 'grant_type=client_credentials',
    },
  );

  if (!response.ok) {
    throw new Error(
      `PayPal client_credentials failed: ${ JSON.stringify(response.error ?? response.data) }`,
    );
  }

  const { access_token: accessToken, expires_in: expiresIn = 32400 } = response.data ?? {};
  if (!accessToken) {
    throw new Error('PayPal client_credentials response missing access_token');
  }

  clientCredentialsTokenCache.set(cacheKey, {
    accessToken,
    // Refresh a minute early.
    expiresAt: Date.now() + (Math.max(expiresIn - 60, 60) * 1000),
  });

  return accessToken;
};

const resolveAccessToken = async (creds) => {
  if (creds?.ACCESS_TOKEN) {
    return creds.ACCESS_TOKEN;
  }

  const { CLIENT_ID, CLIENT_SECRET } = creds ?? {};
  if (CLIENT_ID && CLIENT_SECRET) {
    return getClientCredentialsToken(creds);
  }

  throw new Error(
    'paypal creds require ACCESS_TOKEN or CLIENT_ID + CLIENT_SECRET',
  );
};

const useBaseUrlFromCreds = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const baseUrl = baseUrlForCreds(creds);

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(baseUrl, requestPayload.url || ''),
    },
  };
};

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;

  let accessToken;
  try {
    accessToken = await resolveAccessToken(creds);
  } catch (err) {
    return {
      response: {
        ok: false,
        error: {
          code: 'PAYPAL_AUTH_FAILED',
          message: err.message || String(err),
        },
      },
      breakChain: true,
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

const paypalClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrlFromCreds,
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  paypalClient,
  resolveAccessToken,
  getClientCredentialsToken,
  baseUrlForCreds,
  clientCredentialsTokenCache,
};
