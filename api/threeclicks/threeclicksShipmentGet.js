// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Shipping_>_Details-detail_5

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shipmentNumber'],
]);

const threeclicksShipmentGet = async (credsPayload, shipmentNumber) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, shipmentNumber });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: `/shipping/basic/${ shipmentNumber }`,
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
  threeclicksShipmentGet,
  funcApiConfig,
};
