// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Shipping-create_3

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shipmentPayload'],
]);

const threeclicksShipmentCreate = async (credsPayload, shipmentPayload) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, shipmentPayload });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: '/shipping',
      method: 'post',
      body: shipmentPayload ,
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksShipmentCreate, funcApiConfig: { argsWarden } };
