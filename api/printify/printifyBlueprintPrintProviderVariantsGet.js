// https://developers.printify.com/#retrieve-a-list-of-variants-for-a-blueprint-and-print-provider

const { ArgsWarden, actionSingleOrMultiple, everyIfArray, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const catalogQueryValidator = (catalogQuery) => {
  return valueProvided(catalogQuery?.blueprintId)
    && valueProvided(catalogQuery?.printProviderId);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['catalogQuery', (catalogQuery) => everyIfArray(catalogQueryValidator, catalogQuery)],
]);

const printifyBlueprintPrintProviderVariantsGetSingle = async (
  credsPayload,
  catalogQuery,
  {
    showOutOfStock,
  } = {},
) => {
  const {
    blueprintId,
    printProviderId,
  } = catalogQuery;

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

const printifyBlueprintPrintProviderVariantsGet = async (
  credsPayload,
  catalogQuery,
  {
    showOutOfStock,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    catalogQuery,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    catalogQuery,
    printifyBlueprintPrintProviderVariantsGetSingle,
    (catalogQueryItem) => ({
      args: [credsPayload, catalogQueryItem, { showOutOfStock }],
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
  printifyBlueprintPrintProviderVariantsGet,
  funcApiConfig,
};
