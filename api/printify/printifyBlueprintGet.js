// https://developers.printify.com/#retrieve-a-specific-blueprint

const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['blueprintId'],
]);

const printifyBlueprintGetSingle = async (
  credsPayload,
  blueprintId,
) => {
  return printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/catalog/blueprints/${ blueprintId }.json`,
    },
    context: { credsPayload },
  });
};

const printifyBlueprintGet = async (
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
    printifyBlueprintGetSingle,
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
  printifyBlueprintGet,
  funcApiConfig,
};
