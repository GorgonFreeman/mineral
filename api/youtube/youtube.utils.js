const { YOUTUBE_API_BASE } = require('../youtube/youtube.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
} = require('../utils');

const useApiKeyParam = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_KEY } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      params: {
        key: API_KEY,
        ...requestPayload.params,
      },
    },
  };
};

const interpretYoutubeResponse = async (state) => {
  const { response } = state;

  if (!response.ok) {
    const youtubeError = response.error?.details?.error;

    if (youtubeError) {
      return {
        response: {
          ok: false,
          error: {
            code: youtubeError.code,
            message: youtubeError.message,
            details: youtubeError,
          },
        },
        breakChain: true,
      };
    }

    return { breakChain: true };
  }

  const { data } = response;

  if (data?.error) {
    return {
      response: {
        ok: false,
        error: {
          code: data.error.code,
          message: data.error.message,
          details: data.error,
        },
      },
      breakChain: true,
    };
  }

  return {};
};

const youtubeClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(YOUTUBE_API_BASE),
    useApiKeyParam,
    'fetch',
    interpretYoutubeResponse,
  ],
});

module.exports = {
  youtubeClient,
};
