const { appendUrlToBase, credsFromPayload } = require('./utils');

const resolveCreds = async (state) => {
  const { context } = state;
  const { creds, credsPayload } = context;

  if (creds || !credsPayload) {
    return {};
  }

  const resolvedCreds = await credsFromPayload(credsPayload);

  return {
    context: {
      ...context,
      creds: resolvedCreds,
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
