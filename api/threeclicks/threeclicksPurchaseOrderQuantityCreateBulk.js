// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['quantityPayload'],
]);

const threeclicksPurchaseOrderQuantityCreateBulk = async (credsPayload, quantityPayload) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, quantityPayload });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: '/order/basic/quantity/bulk-style',
      method: 'post',
      body: quantityPayload,
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksPurchaseOrderQuantityCreateBulk, funcApiConfig: { argsWarden } };
