const { BASE_URL } = require('../starshipit/starshipit.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const interpretStarshipitResponse = async (state) => {
  const { response } = state;

  const responseData = response.data || {};
  const {
    success,
    succeeded,
    results,
    errors,
    data: nestedData,
    ...rest
  } = responseData;

  const ok = success === true || succeeded === true;

  if (!ok) {
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

  let data;
  if (results !== undefined) {
    data = results;
  } else if (nestedData && typeof nestedData === 'object' && !Array.isArray(nestedData)) {
    // List endpoints return { page_*, data: { orders|products }, succeeded }
    data = {
      ...rest,
      ...nestedData,
      ...success !== undefined && { success },
      ...succeeded !== undefined && { succeeded },
    };
  } else {
    data = responseData;
  }

  return {
    response: {
      ...response,
      data,
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
