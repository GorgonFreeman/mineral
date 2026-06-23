const { logDeep } = require('../utils');

// TODO: Consider making standard handler supporting resultPath etc.
const shopifyResponseHandler = (response, { resultPath }) => {

  logDeep('shopifyResponseHandler');
  logDeep('before', { response });

  if (!response.ok) {
    return response;
  }

  return {
    ...response,
    ...response?.data ? {
      // TODO: Handle array vs dot paths, and trace full path
      data: response?.data?.[resultPath],
    } : {},
  };
};

module.exports = {
  shopifyResponseHandler,
};