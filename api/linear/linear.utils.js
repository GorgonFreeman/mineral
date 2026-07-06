const { LINEAR_GRAPHQL_URL } = require('../linear/linear.constants');
const {
  FetchClient,
  Chain,
  fetchClientCommonSteps,
} = require('../utils');

const addUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_KEY } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      url: requestPayload.url || LINEAR_GRAPHQL_URL,
      method: requestPayload.method || 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: API_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const linearClientRequestPreparer = new Chain([
  addUrlAndAuthHeaders,
]);

const linearClientResponseInterpreter = new Chain([
  fetchClientCommonSteps.exitEarlyOnNotOk,
  fetchClientCommonSteps.exitEarlyOnGraphqlErrors,
]);

const linearClient = new FetchClient({
  requestPreparer: linearClientRequestPreparer,
  responseInterpreter: linearClientResponseInterpreter,
});

module.exports = {
  linearClient,
};
