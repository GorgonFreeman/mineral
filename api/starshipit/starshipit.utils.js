const { BASE_URL } = require('../starshipit/starshipit.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const interpretStarshipitResponse = async (state) => {
  const { response } = state;

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

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const {
    API_KEY,
    SUB_KEY,
  } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        'StarShipIT-Api-Key': API_KEY,
        'Ocp-Apim-Subscription-Key': SUB_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const starshipitClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    interpretStarshipitResponse,
    fetchClientCommonSteps.digToPath,
  ],
});

module.exports = {
  starshipitClient,
};
