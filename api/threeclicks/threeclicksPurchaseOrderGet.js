// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Order_>_Details-detail_7

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderNumber'],
]);

const threeclicksPurchaseOrderGet = async (credsPayload, orderNumber) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, orderNumber });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: `/order/basic/${ orderNumber }`,
      method: 'get',
    },
    context: {
      credsPayload,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  threeclicksPurchaseOrderGet,
  funcApiConfig,
};
