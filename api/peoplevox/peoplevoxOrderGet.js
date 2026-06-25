const { credsFromPayload } = require('../utils');
const { peoplevoxAuthGet } = require('../peoplevox/peoplevoxAuthGet');

const peoplevoxOrderGet = async (
  credsPayload,
  salesOrderNumber,
) => {

  const {
    CLIENT_ID,
    USERNAME,
    PASSWORD,
  } = credsFromPayload(credsPayload);

  const authResponse = await peoplevoxAuthGet(credsPayload);
  if (!authResponse.ok) {
    return authResponse;
  }

  const { Detail } = authResponse?.data?.['soap:Envelope']?.['soap:Body']?.['AuthenticateResponse']?.['AuthenticateResult'];
  const [clientId, sessionId] = Detail.split(',');

  return {
    ok: true,
    data: {
      sessionId,
    },
  };
};

module.exports = {
  peoplevoxOrderGet,
};
