const { TELNYX_API_BASE_URL } = require('../telnyx/telnyx.constants');
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
        Authorization: `Bearer ${ API_KEY }`,
        ...requestPayload.headers,
      },
    },
  };
};

const telnyxClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(TELNYX_API_BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.unwrapData,
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  telnyxClient,
};
