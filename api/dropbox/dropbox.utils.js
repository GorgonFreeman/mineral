const {
  DROPBOX_API_BASE_URL,
  DROPBOX_CONTENT_BASE_URL,
} = require('../dropbox/dropbox.constants');
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
        Authorization: `Bearer ${ ACCESS_TOKEN }`,
        ...requestPayload.headers,
      },
    },
  };
};

// Dropbox RPC endpoints are almost always POST with a JSON body.
const defaultPostMethod = async (state) => {
  const { requestPayload } = state;
  if (requestPayload.method) {
    return {};
  }

  return {
    requestPayload: {
      ...requestPayload,
      method: 'post',
    },
  };
};

const dropboxClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(DROPBOX_API_BASE_URL),
    useAuthHeaders,
    defaultPostMethod,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

const dropboxContentClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(DROPBOX_CONTENT_BASE_URL),
    useAuthHeaders,
    defaultPostMethod,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  dropboxClient,
  dropboxContentClient,
};
