const { credsFromPayload } = require('../utils');

const peoplevoxOrderGet = async (
  credsPayload,
  salesOrderNumber,
) => {

  const {
    CLIENT_ID,
    USERNAME,
    PASSWORD,
  } = credsFromPayload(credsPayload);

  return {
    ok: true,
    data: {
      salesOrderNumber,
    },
  };
};
