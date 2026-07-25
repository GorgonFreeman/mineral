const { DEFAULT_API_VERSION } = require('../logiwa/logiwa.constants');
const { logiwaAuthGet } = require('../logiwa/logiwaAuthGet');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClientV2,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

const useUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const {
    credsPayload,
    apiVersion = DEFAULT_API_VERSION,
    creds,
  } = context;

  const authResponse = await logiwaAuthGet(credsPayload, { apiVersion });

  if (!authResponse?.ok) {
    return {
      breakChain: true,
      response: authResponse,
    };
  }

  const { token } = authResponse.data;
  const { BASE_URL } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(`${ BASE_URL }/${ apiVersion }`, requestPayload.url),
      headers: {
        Authorization: `Bearer ${ token }`,
        ...requestPayload.headers,
      },
    },
  };
};

const logiwaClient = new FetchClientV2({
  pipeline: [
    resolveCreds,
    useUrlAndAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  logiwaClient,
};
