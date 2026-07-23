const { BASE_URL } = require('../bleckmann/bleckmann.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const { FetchClientV2 } = require('../utils');

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

const bleckmannClient = new FetchClientV2({
  pipeline: [
    resolveCreds,
    useAuthHeaders,
    useBaseUrl(BASE_URL),
    'fetch',
  ],
});

module.exports = {
  bleckmannClient,
};
