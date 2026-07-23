const { appendUrlToBase, credsFromPayload } = require('./utils');

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

const useBaseUrl = (baseUrl) => async (state) => {
  const { requestPayload, context } = state;
  const resolvedBaseUrl = baseUrl ?? context.baseUrl;

  if (!resolvedBaseUrl) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'NO_BASE_URL',
          message: 'No base URL provided',
        },
      },
    };
  }

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(resolvedBaseUrl, requestPayload.url),
    },
  };
};

module.exports = {
  resolveCreds,
  useBaseUrl,
};
