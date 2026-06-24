const { logDeep } = require('../utils');

// TODO: Consider making standard handler supporting resultPath etc.
const shopifyResponseHandler = (response, { resultPath }) => {

  logDeep('shopifyResponseHandler');
  logDeep('before', { response });

  if (!response.ok) {
    return response;
  }

  if (!resultPath || !response?.data) {
    return response;
  }
  
  // TODO: Handle array vs dot paths, and trace full path

  let desiredData = response;
  let omittedData;
  let lastKey;

  for (const key of ['data', resultPath]) {
    const { [key]: value, ...rest } = desiredData;

    if (!value) {
      throw new Error(`resultPath didn't work`);
    }

    desiredData = value;

    if (omittedData) {
      omittedData[lastKey] = rest;
    } else {
      omittedData = { ...rest };
    }

    lastKey = key;
  }

  return {
    ...response,
    ...{
      data: desiredData,
      meta: {
        ...response?.meta,
        ...omittedData,
      },
    },
  };
};

module.exports = {
  shopifyResponseHandler,
};