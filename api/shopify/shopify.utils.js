const { logDeep, pathAsArray, objectDigNodeAtPath } = require('../utils');

// TODO: Consider making standard handler supporting resultPath etc.
const shopifyResponseHandler = (response, { resultPath }) => {

  logDeep('shopifyResponseHandler');
  logDeep('before', { response });

  if (!response.ok) {
    return response;
  }

  const resultPathNodes = [
    'data',
    ...pathAsArray(resultPath),
  ];
  logDeep('resultPathNodes', resultPathNodes);
  // return;

  const { desired, omitted } = objectDigNodeAtPath(response, resultPathNodes, { returnOmitted: true });

  const metaWithOmitted = {
    ...response?.meta,
    omitted,
  };

  return {
    ...response,
    data: desired,
    ...metaWithOmitted && { meta: metaWithOmitted },
  };
};

module.exports = {
  shopifyResponseHandler,
};