const { DEFAULT_API_VERSION } = require('../shopify/shopify.constants');
const { logDeep, pathAsArray, objectDigNodeAtPath, askQuestion, FetchClient, Chain, appendUrlToBase, fetchClientCommonSteps } = require('../utils');

const addUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const {
    creds,
    apiVersion = DEFAULT_API_VERSION,
  } = context;
  const {
    STORE_HANDLE,
    API_KEY,
  } = creds;

  const baseUrl = `https://${ STORE_HANDLE }.myshopify.com/admin/api/${ apiVersion }/graphql.json`;
  const baseHeaders = {
    'X-Shopify-Access-Token': API_KEY,
  };

  return {
    requestPayload: {
      url: appendUrlToBase(baseUrl, requestPayload.url),
      headers: {
        ...baseHeaders,
        ...requestPayload.headers,
      },
    },
  };
};

const shopifyClientRequestPreparer = new Chain([
  addUrlAndAuthHeaders,
]);

const shopifyClientResponseInterpreter = new Chain([
  fetchClientCommonSteps.stripEdgesAndNodes,
  fetchClientCommonSteps.collapseDataWithOneValue,
  fetchClientCommonSteps.exitEarlyOnNotOk,
  fetchClientCommonSteps.exitEarlyOnGraphqlErrors,
  fetchClientCommonSteps.digToPath,
]);

const shopifyClient = new FetchClient({
  requestPreparer: shopifyClientRequestPreparer,
  responseInterpreter: shopifyClientResponseInterpreter,
});

module.exports = {
  shopifyClient,
};