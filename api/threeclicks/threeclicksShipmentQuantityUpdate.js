// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Shipping_>_Details-shipmentQuantityUpdate

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shipmentNumber'],
  ['quantityPayload'],
]);

const threeclicksShipmentQuantityUpdate = async (credsPayload, shipmentNumber, quantityPayload) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    shipmentNumber,
    quantityPayload,
  });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: `/shipping/basic/orders/shipment-quantity/${ shipmentNumber }`,
      method: 'patch',
      body: quantityPayload,
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
  threeclicksShipmentQuantityUpdate,
  funcApiConfig,
};
