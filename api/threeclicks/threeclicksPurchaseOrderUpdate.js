// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Order_>_Details-update_3

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderNumber'],
  ['orderPayload'],
]);

const threeclicksPurchaseOrderUpdate = async (credsPayload, orderNumber, orderPayload) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, orderNumber, orderPayload });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: `/order/basic/${ orderNumber }`,
      method: 'patch',
      body: orderPayload,
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksPurchaseOrderUpdate, funcApiConfig: { argsWarden } };
