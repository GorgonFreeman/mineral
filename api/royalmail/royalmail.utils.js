const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');
const { ROYALMAIL_API_BASE_URL } = require('./royalmail.constants');

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const {
    CLIENT_ID,
    CLIENT_SECRET,
  } = creds || {};

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'ROYALMAIL_AUTH_CONFIG_ERROR',
          message: 'Royal Mail creds require CLIENT_ID and CLIENT_SECRET',
        },
      },
    };
  }

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Accept: 'application/json',
        'X-Accept-RMG-Terms': 'yes',
        'X-IBM-Client-Id': CLIENT_ID,
        'X-IBM-Client-Secret': CLIENT_SECRET,
        ...requestPayload.headers,
      },
    },
  };
};

const royalmailClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(ROYALMAIL_API_BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  royalmailClient,
};
