const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClientV2,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

// TODO: Allow creds failure (e.g. missing BASE_URL / ACCESS_TOKEN → INVALID_CREDS before fetch)
const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const {
    BASE_URL,
    ACCESS_TOKEN,
  } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(BASE_URL, requestPayload.url),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${ ACCESS_TOKEN }`,
        ...requestPayload.headers,
      },
    },
  };
};

const workableClient = new FetchClientV2({
  pipeline: [
    resolveCreds,
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  workableClient,
};
