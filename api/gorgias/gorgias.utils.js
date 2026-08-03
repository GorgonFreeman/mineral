const { apiBaseUrlForDomain } = require('../gorgias/gorgias.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  appendUrlToBase,
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const useUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const {
    API_KEY,
    DOMAIN,
    EMAIL,
  } = creds;

  const basicToken = Buffer
    .from(`${ EMAIL }:${ API_KEY }`)
    .toString('base64');

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(apiBaseUrlForDomain(DOMAIN), requestPayload.url),
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${ basicToken }`,
        ...requestPayload.headers,
      },
    },
  };
};

const gorgiasClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  gorgiasClient,
};
