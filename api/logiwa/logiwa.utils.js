const { DEFAULT_API_VERSION } = require('../logiwa/logiwa.constants');
const { logiwaAuthGet } = require('../logiwa/logiwaAuthGet');
const {
  FetchClient,
  Chain,
  appendUrlToBase,
  credsFromPayload,
  fetchClientCommonSteps,
} = require('../utils');

const addUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { credsPayload, apiVersion = DEFAULT_API_VERSION } = context;

  const creds = context.creds ?? await credsFromPayload(credsPayload);
  const authResponse = await logiwaAuthGet(credsPayload);
  const { data } = authResponse;
  const { token } = data;

  // TODO: Handle failed auth

  const { BASE_URL } = creds;

  return {
    context: {
      creds,
    },
    requestPayload: {
      url: appendUrlToBase(`${ BASE_URL }/${ apiVersion }`, requestPayload.url),
      headers: {
        Authorization: `Bearer ${ token }`,
        ...requestPayload.headers,
      },
    },
  };
};

const logiwaClientRequestPreparer = new Chain([
  addUrlAndAuthHeaders,
]);

const logiwaClientResponseInterpreter = new Chain([
  fetchClientCommonSteps.exitEarlyOnNotOk,
]);

const logiwaClient = new FetchClient({
  requestPreparer: logiwaClientRequestPreparer,
  responseInterpreter: logiwaClientResponseInterpreter,
});

module.exports = {
  logiwaClient,
};
