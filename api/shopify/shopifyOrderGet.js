const { wait } = require('../utils');
const { credsValidator } = require('../validators');

const shopifyOrderGet = async (
  creds,
  orderId,
) => {

  if (!credsValidator(creds)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'Invalid creds',
      },
    };
  }

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