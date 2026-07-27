// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Order_>_Details-quantityNormalUpdate

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderNumber'],
  ['orderColoursizeId'],
  ['quantityPayload'],
]);

const threeclicksPurchaseOrderQuantityUpdate = async (
  credsPayload,
  orderNumber,
  orderColoursizeId,
  quantityPayload,
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderNumber,
    orderColoursizeId,
    quantityPayload,
  });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: `/order/basic/quantity/normal/${ orderNumber }/${ orderColoursizeId }`,
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
  threeclicksPurchaseOrderQuantityUpdate,
  funcApiConfig,
};
