const { LINEAR_GRAPHQL_URL } = require('../linear/linear.constants');
const { resolveCreds } = require('../pipelineSteps');
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
      url: requestPayload.url || LINEAR_GRAPHQL_URL,
      method: requestPayload.method || 'post',
      headers: {
        Authorization: API_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const linearClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    fetchClientCommonSteps.exitEarlyOnGraphqlErrors,
  ],
});

module.exports = {
  linearClient,
};
