// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Order-createNormal

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderPayload'],
]);

const threeclicksPurchaseOrderCreate = async (credsPayload, orderPayload) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, orderPayload });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: '/order/normal',
      method: 'post',
      body: orderPayload ,
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksPurchaseOrderCreate, funcApiConfig: { argsWarden } };
