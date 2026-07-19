const { BASE_URL } = require('../stripe/stripe.constants');
const {
  FetchClient,
  Chain,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

const addUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_KEY } = creds;

  const body = requestPayload.body
    ? new URLSearchParams(requestPayload.body).toString()
    : undefined;

  return {
    requestPayload: {
      ...requestPayload,
      method: requestPayload.method || 'post',
      url: appendUrlToBase(BASE_URL, requestPayload.url),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${ API_KEY }`,
        ...requestPayload.headers,
      },
      ...(body && { body }),
    },
  };
};

const stripeClientRequestPreparer = new Chain([
  addUrlAndAuthHeaders,
]);

const stripeClientResponseInterpreter = new Chain([
  fetchClientCommonSteps.exitEarlyOnNotOk,
]);

const stripeClient = new FetchClient({
  requestPreparer: stripeClientRequestPreparer,
  responseInterpreter: stripeClientResponseInterpreter,
});

module.exports = {
  stripeClient,
};
