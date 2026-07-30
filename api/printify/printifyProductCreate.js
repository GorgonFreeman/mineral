// https://developers.printify.com/#create-a-new-product

const { ArgsWarden, actionSingleOrMultiple, everyIfArray, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const productPayloadValidator = (productPayload) => {
  return valueProvided(productPayload?.title)
    && valueProvided(productPayload?.description)
    && valueProvided(productPayload?.blueprintId)
    && valueProvided(productPayload?.printProviderId)
    && Array.isArray(productPayload?.variants)
    && Array.isArray(productPayload?.printAreas);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productPayload', (productPayload) => everyIfArray(productPayloadValidator, productPayload)],
]);

const printifyProductCreateSingle = async (
  credsPayload,
  productPayload,
  {
    shopId,
  } = {},
) => {
  const {
    title,
    description,
    blueprintId,
    printProviderId,
    variants,
    printAreas,
  } = productPayload;

  return printifyClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/shops/${ shopId }/products.json`,
      body: {
        title,
        description,
        blueprint_id: blueprintId,
        print_provider_id: printProviderId,
        variants,
        print_areas: printAreas,
      },
    },
    context: { credsPayload },
  });
};

const printifyProductCreate = async (
  credsPayload,
  productPayload,
  {
    shopId,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopIdFromCreds({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  return actionSingleOrMultiple(
    productPayload,
    printifyProductCreateSingle,
    (productPayloadItem) => ({
      args: [credsPayload, productPayloadItem, { shopId }],
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
  printifyProductCreate,
  funcApiConfig,
};
