const { wait } = require('../utils');
const { credsValidator } = require('../validators');

const shopifyOrderGet = async (
  credsPayload,
  orderId,
) => {

  if (!credsValidator(credsPayload)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'Invalid creds',
      },
    };
  }

  const creds = credsFromPayload(credsPayload);

  const {
    STORE_HANDLE,
    API_KEY,
  } = creds;

  console.log(STORE_HANDLE, API_KEY)

  await wait(1000);
  console.log('Mineral says hi');
  return {
    ok: true,
    data: {
      id: orderId,
    },
  };
};

module.exports = {
  shopifyOrderGet,
};