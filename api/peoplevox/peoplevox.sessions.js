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
  };
};

const withPeoplevoxAuth = async (fetchPayload, next) => {
  const { context = {} } = fetchPayload;
  const { credsPayload } = context;

  const sessionIdResponse = await getSessionId(credsPayload);

  if (!sessionIdResponse.ok) {
    return sessionIdResponse;
  }

  return next({
    ...fetchPayload,
    context: {
      ...context,
      sessionId: sessionIdResponse.data,
    },
  });
};

module.exports = {
  getSessionId,
  withPeoplevoxAuth,
};
