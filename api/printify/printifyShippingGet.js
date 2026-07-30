// https://developers.printify.com/#retrieve-shipping-information

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

const printifyShippingGetSingle = async (
  credsPayload,
  catalogQuery,
) => {
  const {
    blueprintId,
    printProviderId,
  } = catalogQuery;

  return printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/catalog/blueprints/${ blueprintId }/print_providers/${ printProviderId }/shipping.json`,
    },
    context: { credsPayload },
  });
};

const printifyShippingGet = async (
  credsPayload,
  catalogQuery,
  {
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
    printifyShippingGetSingle,
    (catalogQueryItem) => ({
      args: [credsPayload, catalogQueryItem],
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
  printifyShippingGet,
  funcApiConfig,
};
