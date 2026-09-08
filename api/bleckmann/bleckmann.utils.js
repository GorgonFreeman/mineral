const { BASE_URL } = require('../bleckmann/bleckmann.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const { FetchClient, fetchClientCommonSteps } = require('../utils');

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { PRIMARY_KEY } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        'x-api-key': PRIMARY_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const bleckmannClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useAuthHeaders,
    useBaseUrl(BASE_URL),
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    // Bleckmann wraps payloads in `data` — handlers opt in with context.resultPath
    fetchClientCommonSteps.digToPath,
  ],
});

module.exports = {
  bleckmannClient,
};
