const { BASE_URL } = require('../starshipit/starshipit.constants');
const {
  FetchClient,
  Chain,
  appendUrlToBase,
  fetchClientCommonSteps,
  logDeep,
  askQuestion,
} = require('../utils');

const interpretStarshipitResponse = async (state) => {
  const { response } = state;
  logDeep(response);
  await askQuestion('?');

  const { success, results, errors } = response.data;

  if (!success) {

    const firstError = errors?.[0];
    
    // TODO: Consider removing data if errors
    return {
      response: {
        ...response,
        ok: false,
        error: {
          message: firstError?.message,
          details: errors,
        },
      },
      breakChain: true,
    };
  }

  return {
    response: {
      ...response,
      data: results ?? response.data,
    },
  };
};

const addUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const {
    API_KEY,
    SUB_KEY,
  } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(BASE_URL, requestPayload.url),
      headers: {
        'StarShipIT-Api-Key': API_KEY,
        'Ocp-Apim-Subscription-Key': SUB_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const starshipitClientRequestPreparer = new Chain([
  addUrlAndAuthHeaders,
]);

const starshipitClientResponseInterpreter = new Chain([
  fetchClientCommonSteps.exitEarlyOnNotOk,
  interpretStarshipitResponse,
]);

const starshipitClient = new FetchClient({
  requestPreparer: starshipitClientRequestPreparer,
  responseInterpreter: starshipitClientResponseInterpreter,
});

module.exports = {
  starshipitClient,
};
