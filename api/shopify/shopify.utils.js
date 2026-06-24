const { logDeep, pathAsArray, objectDigNodeAtPath, askQuestion, FetchClient, Chain, appendUrlToBase, fetchClientCommonSteps } = require('../utils');

// TODO: Consider making standard handler supporting resultPath etc.
const shopifyResponseHandler = async (response, { resultPath }) => {

  logDeep('shopifyResponseHandler');
  logDeep('before', { response });
  await askQuestion('?');

  if (!response.ok) {
    return response;
  }

  const resultPathNodes = [
    'data',
    ...pathAsArray(resultPath),
  ];

  const { 
    data: responseData, 
  } = response;
  let { 
    meta: responseMeta, 
  } = response;

  const resultPathData = objectDigNodeAtPath(responseData, resultPathNodes);
  if (!resultPathData) {
    responseMeta = responseMeta || {};
    responseMeta.fullData = responseData;
  }

  return {
    ...response,
    data: resultPathData,
    ...responseMeta && { meta: responseMeta },
  };
};

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
]);

const shopifyClient = new FetchClient({
  requestPreparer: shopifyClientRequestPreparer,
  responseInterpreter: shopifyClientResponseInterpreter,
});

module.exports = {
  shopifyClient,
};