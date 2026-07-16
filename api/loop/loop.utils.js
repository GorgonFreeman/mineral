const { LOOP_API_BASE_URL } = require('../loop/loop.constants');
const {
  FetchClient,
  Chain,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

// TODO: Allow creds failure (e.g. missing API_KEY → INVALID_CREDS before fetch)
const addUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_KEY } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(LOOP_API_BASE_URL, requestPayload.url),
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': API_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const loopClientRequestPreparer = new Chain([
  addUrlAndAuthHeaders,
]);

const loopClientResponseInterpreter = new Chain([
  fetchClientCommonSteps.exitEarlyOnNotOk,
]);

const loopClient = new FetchClient({
  requestPreparer: loopClientRequestPreparer,
  responseInterpreter: loopClientResponseInterpreter,
});

module.exports = {
  loopClient,
};
