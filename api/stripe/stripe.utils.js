const { BASE_URL } = require('../stripe/stripe.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_KEY } = creds;

  const body = requestPayload.body
    ? new URLSearchParams(requestPayload.body).toString()
    : undefined;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${ API_KEY }`,
        ...requestPayload.headers,
      },
      ...(body && { body }),
    },
  };
};

const stripeClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  stripeClient,
};
