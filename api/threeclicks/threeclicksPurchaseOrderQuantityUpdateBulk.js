// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderNumber'],
  ['orderColoursizeId'],
  ['quantityPayload'],
]);

const threeclicksPurchaseOrderQuantityUpdateBulk = async (
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
      url: `/order/basic/quantity/bulk-style/${ orderNumber }/${ orderColoursizeId }`,
      method: 'patch',
      body: quantityPayload,
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksPurchaseOrderQuantityUpdateBulk, funcApiConfig: { argsWarden } };
