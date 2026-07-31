const { BASE_URL } = require('../printify/printify.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const { FetchClient, fetchClientCommonSteps, resolveFromCreds } = require('../utils');

const resolveShopIdFromCreds = resolveFromCreds('SHOP_ID');

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_KEY } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Authorization: `Bearer ${ API_KEY }`,
        ...requestPayload.headers,
      },
    },
  };
};

const printifyClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useAuthHeaders,
    useBaseUrl(BASE_URL),
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  printifyClient,
  resolveShopIdFromCreds,
};
