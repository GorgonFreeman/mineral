// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Shipping_>_Details-addOrderToUnassignedOrder

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shipmentNumber'],
  ['orderNumber'],
]);

const threeclicksShipmentOrderAdd = async (credsPayload, shipmentNumber, orderNumber) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, shipmentNumber, orderNumber });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: '/shipping/basic/unassigned-orders/order',
      method: 'post',
      body: {
      shipment_number: shipmentNumber,
      order_number: orderNumber,
      },
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksShipmentOrderAdd, funcApiConfig: { argsWarden } };
