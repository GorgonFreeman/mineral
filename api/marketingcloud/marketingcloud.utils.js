const { marketingcloudAuthGet } = require('../marketingcloud/marketingcloudAuthGet');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

const useRestUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;

  const authResponse = await marketingcloudAuthGet({
    credsObject: creds,
  });

  if (!authResponse?.ok) {
    return {
      breakChain: true,
      response: authResponse,
    };
  }

  const {
    access_token,
    rest_instance_url,
  } = authResponse.data;

  const restBase = rest_instance_url || creds.REST_URL?.replace(/\/$/, '');

  if (!restBase) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'INVALID_CREDS',
          message: 'Provide REST_URL in creds or ensure auth returns rest_instance_url.',
        },
      },
    };
  }

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(restBase, requestPayload.url),
      headers: {
        Authorization: `Bearer ${ access_token }`,
        ...requestPayload.headers,
      },
    },
  };
};

const marketingcloudClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useRestUrlAndAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  marketingcloudClient,
};
