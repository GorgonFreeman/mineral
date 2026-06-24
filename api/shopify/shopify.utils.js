const { logDeep, pathAsArray, objectDigNodeAtPath, askQuestion, FetchClient, Chain } = require('../utils');

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

const shopifyClientRequestPreparer = new Chain([
  async (requestPayload, context) => {
    logDeep({ requestPayload, context });
    await askQuestion('?');
    return requestPayload;
  },
]);

const shopifyClientResponseInterpreter = new Chain([
  async (response, context) => {
    logDeep({ response, context });
    await askQuestion('?');
    return response;
  },
]);

const shopifyClient = new FetchClient({
  requestPreparer: shopifyClientRequestPreparer,
  responseInterpreter: shopifyClientResponseInterpreter,
});

module.exports = {
  shopifyClient,
};