const {
  FetchClient,
  Chain,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

const addUrlAndAuthHeaders = async (state) => {
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

const workableClientRequestPreparer = new Chain([
  addUrlAndAuthHeaders,
]);

const workableClientResponseInterpreter = new Chain([
  fetchClientCommonSteps.exitEarlyOnNotOk,
]);

const workableClient = new FetchClient({
  requestPreparer: workableClientRequestPreparer,
  responseInterpreter: workableClientResponseInterpreter,
});

module.exports = {
  workableClient,
};
