const { CLICKUP_API_BASE_URL } = require('../clickup/clickup.constants');
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
        Authorization: API_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const clickupClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(CLICKUP_API_BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  clickupClient,
};
