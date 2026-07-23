const { appendUrlToBase } = require('./utils');

const useBaseUrl = (baseUrl) => async (state) => {
  const { requestPayload, context } = state;
  const resolvedBaseUrl = baseUrl ?? context.baseUrl;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(resolvedBaseUrl, requestPayload.url),
    },
  };
};

module.exports = {
  useBaseUrl,
};
