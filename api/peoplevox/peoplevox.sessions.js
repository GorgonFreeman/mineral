const { credsFromPayload } = require('../utils');
const { peoplevoxAuthGet } = require('./peoplevoxAuthGet');

const SESSION_IDS = new Map();

const getSessionId = async (credsPayload) => {
  const { CLIENT_ID } = await credsFromPayload(credsPayload);

  let sessionId = SESSION_IDS.get(CLIENT_ID);

  if (sessionId) {
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
  return {
    ok: true,
    data: responseSessionId,
  };
};

module.exports = {
  getSessionId,
};