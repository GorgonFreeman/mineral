const {
  BASE_URL,
  DEFAULT_API_VERSION,
} = require('../yotpo/yotpo.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

const useUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { apiVersion = DEFAULT_API_VERSION, creds } = context;
  const { API_KEY, GUID } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(`${ BASE_URL }/${ apiVersion }`, requestPayload.url),
      headers: {
        'x-api-key': API_KEY,
        'x-guid': GUID,
        ...requestPayload.headers,
      },
    },
  };
};

const yotpoClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    fetchClientCommonSteps.digToPath,
  ],
});

module.exports = {
  yotpoClient,
};
