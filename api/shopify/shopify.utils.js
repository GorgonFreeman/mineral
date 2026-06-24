const { logDeep, pathAsArray, objectDigNodeAtPath, askQuestion, FetchClient, Chain, appendUrlToBase, fetchClientCommonSteps } = require('../utils');

const addUrlAndAuthHeaders = async (requestPayload, context) => {
  const { creds } = context;
  const {
    STORE_HANDLE,
    API_KEY,
  } = creds;

  const baseUrl = `https://${ STORE_HANDLE }.myshopify.com/admin/api/2024-10/graphql.json`;
  const baseHeaders = {
    'X-Shopify-Access-Token': API_KEY,
  };

  return {
    ...requestPayload,
    url: appendUrlToBase(baseUrl, requestPayload.url),
    headers: {
      ...baseHeaders,
      ...requestPayload.headers,
    },
  };
};

const shopifyClientRequestPreparer = new Chain([
  addUrlAndAuthHeaders,
]);

const shopifyClientResponseInterpreter = new Chain([
  fetchClientCommonSteps.inspect,
  fetchClientCommonSteps.exitEarlyOnNotOk,
  fetchClientCommonSteps.digToPath,
]);

const shopifyClient = new FetchClient({
  requestPreparer: shopifyClientRequestPreparer,
  responseInterpreter: shopifyClientResponseInterpreter,
});

module.exports = {
  shopifyClient,
};