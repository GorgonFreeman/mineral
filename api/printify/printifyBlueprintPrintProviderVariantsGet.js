// https://developers.printify.com/#retrieve-a-list-of-variants-for-a-blueprint-and-print-provider

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['blueprintId'],
  ['printProviderId'],
]);

const printifyBlueprintPrintProviderVariantsGet = async (
  credsPayload,
  blueprintId,
  printProviderId,
  {
    showOutOfStock,
  } = {},
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
      url: `/catalog/blueprints/${ blueprintId }/print_providers/${ printProviderId }/variants.json`,
      params: {
        ...(showOutOfStock && { 'show-out-of-stock': showOutOfStock }),
      },
    },
    context: { credsPayload },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyBlueprintPrintProviderVariantsGet,
  funcApiConfig,
};
