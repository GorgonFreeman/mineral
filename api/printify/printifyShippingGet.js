// https://developers.printify.com/#retrieve-shipping-information

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['blueprintId'],
  ['printProviderId'],
]);

const printifyShippingGet = async (
  credsPayload,
  blueprintId,
  printProviderId,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    blueprintId,
    printProviderId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/catalog/blueprints/${ blueprintId }/print_providers/${ printProviderId }/shipping.json`,
    },
    context: { credsPayload },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyShippingGet,
  funcApiConfig,
};
