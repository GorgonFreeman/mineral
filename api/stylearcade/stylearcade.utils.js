const { BASE_URL } = require('../stylearcade/stylearcade.constants');
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
        'Content-Type': 'application/json',
        'Api-Key': API_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const stylearcadeClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  stylearcadeClient,
};
