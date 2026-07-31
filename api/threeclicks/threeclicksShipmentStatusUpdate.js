// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Shipping-detailsUpdate

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shipmentNumber'],
  ['status'],
]);

const threeclicksShipmentStatusUpdate = async (
  credsPayload,
  shipmentNumber,
  status,
  {
    isUpdateAllAssociatedOrdersToCompletedStatus = true,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    shipmentNumber,
    status,
  });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: `/shipping/status/${ shipmentNumber }`,
      method: 'patch',
      body: {
      status,
      is_update_all_associated_orders_to_completed_status: isUpdateAllAssociatedOrdersToCompletedStatus,
      },
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
  threeclicksShipmentStatusUpdate,
  funcApiConfig,
};
