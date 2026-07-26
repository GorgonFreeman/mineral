const { LOOP_API_BASE_URL } = require('../loop/loop.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

// TODO: Allow creds failure (e.g. missing API_KEY → INVALID_CREDS before fetch)
const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_KEY } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        'X-Authorization': API_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const loopClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(LOOP_API_BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  loopClient,
};
