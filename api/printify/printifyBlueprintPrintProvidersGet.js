// https://developers.printify.com/#retrieve-a-list-of-print-providers-for-a-blueprint

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['blueprintId'],
]);

const printifyBlueprintPrintProvidersGet = async (
  credsPayload,
  blueprintId,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    blueprintId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/catalog/blueprints/${ blueprintId }/print_providers.json`,
    },
    context: { credsPayload },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyBlueprintPrintProvidersGet,
  funcApiConfig,
};
