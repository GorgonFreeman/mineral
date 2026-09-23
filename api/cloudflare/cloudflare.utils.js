const { BASE_URL } = require('../cloudflare/cloudflare.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_TOKEN } = creds;

  if (!API_TOKEN) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'INVALID_CREDS',
          message: 'API_TOKEN is required.',
        },
      },
    };
  }

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Authorization: `Bearer ${ API_TOKEN }`,
        ...requestPayload.headers,
      },
    },
  };
};

const interpretCloudflareResponse = async (state) => {
  const { response } = state;

  if (!response?.ok) {
    return {};
  }

  const {
    success,
    errors,
    messages,
    result_info: resultInfo,
  } = response.data || {};

  if (success === false) {
    return {
      response: {
        ok: false,
        error: {
          code: 'CLOUDFLARE_API_ERROR',
          message: 'Cloudflare API returned success: false.',
          details: errors ?? response.data,
        },
      },
      breakChain: true,
    };
  }

  const meta = {
    ...messages?.length && { messages },
    ...resultInfo && { resultInfo },
  };

  if (!Object.keys(meta).length) {
    return {};
  }

  return {
    response: {
      meta,
    },
  };
};

const cloudflareClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    interpretCloudflareResponse,
    fetchClientCommonSteps.digToPath,
  ],
});

module.exports = {
  cloudflareClient,
  interpretCloudflareResponse,
};
