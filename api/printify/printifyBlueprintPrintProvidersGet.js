// https://developers.printify.com/#retrieve-a-list-of-print-providers-for-a-blueprint

const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['blueprintId'],
]);

const printifyBlueprintPrintProvidersGetSingle = async (
  credsPayload,
  blueprintId,
) => {
  return printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/catalog/blueprints/${ blueprintId }/print_providers.json`,
    },
    context: { credsPayload },
  });
};

const printifyBlueprintPrintProvidersGet = async (
  credsPayload,
  blueprintId,
  {
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    blueprintId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    blueprintId,
    printifyBlueprintPrintProvidersGetSingle,
    (blueprintIdItem) => ({
      args: [credsPayload, blueprintIdItem],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyBlueprintPrintProvidersGet,
  funcApiConfig,
};
