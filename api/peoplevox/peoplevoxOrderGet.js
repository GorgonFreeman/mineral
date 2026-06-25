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

  return {
    ok: true,
    data: {
      salesOrderNumber,
    },
  };
};
