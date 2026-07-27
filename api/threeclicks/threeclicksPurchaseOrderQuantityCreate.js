// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Order_>_Details-quantityNormalCreate

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['quantityPayload'],
]);

const threeclicksPurchaseOrderQuantityCreate = async (credsPayload, quantityPayload) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, quantityPayload });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: '/order/basic/quantity/normal',
      method: 'post',
      body: quantityPayload ,
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
  threeclicksPurchaseOrderQuantityCreate,
  funcApiConfig,
};
