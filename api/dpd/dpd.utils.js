const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  customFetch,
  fetchClientCommonSteps,
} = require('../utils');
const {
  DPD_API_BASE_URL,
  DPD_AUTH_PATH,
} = require('./dpd.constants');

const geoSessionCache = new Map();

const baseUrlForCreds = (creds) => {
  return (creds?.BASE_URL || DPD_API_BASE_URL).replace(/\/$/, '');
};

const geoClientForCreds = (creds) => {
  return creds?.GEO_CLIENT || `account/${ creds?.ACCOUNT_NUMBER || '' }`;
};

const cacheKeyForCreds = (creds) => {
  return [
    baseUrlForCreds(creds),
    creds?.USERNAME || '',
    creds?.ACCOUNT_NUMBER || '',
  ].join(':');
};

const getGeoSession = async (creds) => {
  const {
    USERNAME,
    PASSWORD,
  } = creds || {};

  if (!USERNAME || !PASSWORD || !geoClientForCreds(creds).split('/').pop()) {
    throw new Error(
      'DPD creds require USERNAME, PASSWORD, and ACCOUNT_NUMBER or GEO_CLIENT',
    );
  }

  const cacheKey = cacheKeyForCreds(creds);
  const cachedSession = geoSessionCache.get(cacheKey);
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession.geoSession;
  }

  const basicAuth = Buffer
    .from(`${ USERNAME }:${ PASSWORD }`)
    .toString('base64');
  const response = await customFetch(
    appendUrlToBase(baseUrlForCreds(creds), DPD_AUTH_PATH),
    {
      method: 'post',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${ basicAuth }`,
        GEOClient: geoClientForCreds(creds),
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `DPD authentication failed: ${ JSON.stringify(response.error || response.data) }`,
    );
  }

  const geoSession = response.data?.geoSession || response.data?.data?.geoSession;
  if (!geoSession) {
    throw new Error('DPD authentication response missing geoSession');
  }

  geoSessionCache.set(cacheKey, {
    geoSession,
    expiresAt: Date.now() + (60 * 60 * 1000),
  });

  return geoSession;
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

  let geoSession;
  try {
    geoSession = await getGeoSession(creds);
  } catch (error) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'DPD_AUTH_ERROR',
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
        GEOClient: geoClientForCreds(creds),
        GEOSession: geoSession,
        ...requestPayload.headers,
      },
    },
  };
};

const dpdClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrlFromCreds,
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  dpdClient,
  geoSessionCache,
  getGeoSession,
};
