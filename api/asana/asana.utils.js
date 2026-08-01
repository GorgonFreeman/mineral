const { ASANA_API_BASE_URL } = require('../asana/asana.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { ACCESS_TOKEN } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${ ACCESS_TOKEN }`,
        ...requestPayload.headers,
      },
    },
  };
};

const asanaClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(ASANA_API_BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  asanaClient,
};
