const { BASE_URL } = require('../etsy/etsy.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const { FetchClient, fetchClientCommonSteps } = require('../utils');

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

// TODO: resolveEtsyAccessTokenIntoContext — load accessToken into context (refresh when expired) when withBearer.
const resolveEtsyAccessToken = async () => ({});

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
    resolveEtsyAccessToken,
    useEtsyBaseUrl,
    useEtsyApiKeyHeader,
    useEtsyBearerFromContext,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  etsyClient,
};
