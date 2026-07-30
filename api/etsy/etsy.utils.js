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

// OAuth Bearer + token refresh will attach when context.withBearer is true (see bedrock etsy.utils).
const etsyClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useEtsyBaseUrl,
    useEtsyApiKeyHeader,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  etsyClient,
};
