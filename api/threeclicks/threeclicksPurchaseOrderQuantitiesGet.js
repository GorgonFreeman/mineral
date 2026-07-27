// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Order_>_Details-quantityNormal

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderNumber'],
]);

const threeclicksPurchaseOrderQuantitiesGet = async (credsPayload, orderNumber) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, orderNumber });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: `/order/basic/quantity/normal/${ orderNumber }`,
      method: 'get',
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksPurchaseOrderQuantitiesGet, funcApiConfig: { argsWarden } };
