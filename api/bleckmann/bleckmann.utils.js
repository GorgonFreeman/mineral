const { FetchClientV2, appendUrlToBase, logDeep } = require('../utils');

const useBaseUrl = (state) => {
  const { context, requestPayload } = state;
  const { baseUrl } = context;
  const { url } = requestPayload;
  logDeep(state);
  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(baseUrl, url),
    },
  };
};

const bleckmannClient = new FetchClientV2({
  pipeline: [
    useBaseUrl,
    'fetch',
  ],
});

module.exports = {
  bleckmannClient,
};
