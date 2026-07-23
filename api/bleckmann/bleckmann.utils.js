const {
  FetchClientV2,
  appendUrlToBase,
  credsFromPayload,
} = require('../utils');

const resolveCreds = async (state) => {
  const { context } = state;

  if (context.creds || !context.credsPayload) {
    return {};
  }

  const creds = await credsFromPayload(context.credsPayload);

  return {
    context: {
      creds,
    },
  };
};

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { PRIMARY_KEY } = context.creds;

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

const useBaseUrl = (state) => {
  const { context, requestPayload } = state;
  const { baseUrl } = context;
  const { url } = requestPayload;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(baseUrl, url),
    },
  };
};

const bleckmannClient = new FetchClientV2({
  pipeline: [
    resolveCreds,
    useAuthHeaders,
    useBaseUrl,
    'fetch',
  ],
});

module.exports = {
  bleckmannClient,
};
