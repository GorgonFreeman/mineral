const { DEFAULT_API_VERSION } = require('../salesforce/salesforce.constants');
const { salesforceAuthGet } = require('../salesforce/salesforceAuthGet');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

const useUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const {
    apiVersion = DEFAULT_API_VERSION,
    creds,
  } = context;

  const authResponse = await salesforceAuthGet({
    credsObject: creds,
  });

  if (!authResponse?.ok) {
    return {
      breakChain: true,
      response: authResponse,
    };
  }

  const {
    access_token,
    instance_url,
  } = authResponse.data;

  const dataBase = appendUrlToBase(
    instance_url,
    `/services/data/v${ apiVersion }`,
  );

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(dataBase, requestPayload.url),
      headers: {
        Authorization: `Bearer ${ access_token }`,
        ...requestPayload.headers,
      },
    },
  };
};

const salesforceClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  salesforceClient,
};
