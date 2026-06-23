const { wait } = require('../utils');

const shopifyOrderGet = async (orderId) => {
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