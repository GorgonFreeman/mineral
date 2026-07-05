const { 
  BASE_URL, 
  DEFAULT_API_VERSION, 
} = require('../yotpo/yotpo.constants');
const { 
  FetchClient, 
  Chain, 
  appendUrlToBase, 
  fetchClientCommonSteps, 
} = require('../utils');

const addUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds, apiVersion = DEFAULT_API_VERSION } = context;
  const { API_KEY, GUID } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(`${ BASE_URL }/${ apiVersion }`, requestPayload.url),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-guid': GUID,
        ...requestPayload.headers,
      },
    },
  };
};

const yotpoClientRequestPreparer = new Chain([
  addUrlAndAuthHeaders,
]);

const yotpoClientResponseInterpreter = new Chain([
  fetchClientCommonSteps.exitEarlyOnNotOk,
  fetchClientCommonSteps.digToPath,
]);

const yotpoClient = new FetchClient({
  requestPreparer: yotpoClientRequestPreparer,
  responseInterpreter: yotpoClientResponseInterpreter,
});

module.exports = {
  yotpoClient,
};
