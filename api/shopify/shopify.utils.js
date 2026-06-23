const { logDeep } = require('../utils');

const shopifyResponseHandler = (response) => {

  logDeep('shopifyResponseHandler');
  logDeep('before', { response });

  if (!response.ok) {
    return response;
  }
  return response?.data || response;
};

module.exports = {
  shopifyResponseHandler,
};