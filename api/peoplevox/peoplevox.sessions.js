const { HOSTED } = require('../constants');
const { credsFromPayload } = require('../utils');
const { peoplevoxAuthGet } = require('./peoplevoxAuthGet');

// TODO: Track where auth comes from in order to facilitate retrying
// TODO: Consider only storing auth when successful request goes through

const SESSION_IDS = new Map();

const getSessionId = async (credsPayload) => {
  const { CLIENT_ID } = await credsFromPayload(credsPayload);

  let sessionId = SESSION_IDS.get(CLIENT_ID);

  if (sessionId) {
    !HOSTED && console.log('Peoplevox auth: from memory');
    return {
      ok: true,
      data: sessionId,
      meta: {
        source: 'memory',
      },
    };
  }

  const authResponse = await peoplevoxAuthGet(credsPayload);

  if (!authResponse.ok) {
    return authResponse;
  }

  const { Detail } = authResponse?.data?.['soap:Envelope']?.['soap:Body']?.['AuthenticateResponse']?.['AuthenticateResult'];
  const [, responseSessionId] = Detail.split(',');

  SESSION_IDS.set(CLIENT_ID, responseSessionId);
  !HOSTED && console.log('Peoplevox auth: from API');
  return {
    ok: true,
    data: responseSessionId,
    meta: {
      source: 'api',
    },
  };
};

const setSessionId = async (credsPayload, sessionId) => {
  const { CLIENT_ID } = await credsFromPayload(credsPayload);
  SESSION_IDS.set(CLIENT_ID, sessionId);
};

const withPeoplevoxSession = async (fetchPayload, next) => {
  const { context = {} } = fetchPayload;
  const { credsPayload } = context;

  const sessionIdResponse = await getSessionId(credsPayload);

  if (!sessionIdResponse.ok) {
    return sessionIdResponse;
  }

  const sessionId = sessionIdResponse.data;

  const response = await next({
    ...fetchPayload,
    context: {
      ...context,
      sessionId,
    },
  });

  if (response.ok) {
    await setSessionId(credsPayload, sessionId);
  }

  // TODO: Check if it was an auth error, and try another auth method if so
  return response;
};

module.exports = {
  getSessionId,
  setSessionId,
  withPeoplevoxSession,
};
