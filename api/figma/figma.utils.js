const { FIGMA_API_BASE_URL } = require('../figma/figma.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_KEY } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        'X-Figma-Token': API_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const figmaClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(FIGMA_API_BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  figmaClient,
};
