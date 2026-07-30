// https://developers.printify.com/#update-a-product

const { ArgsWarden, actionSingleOrMultiple, everyIfArray, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const productUpdateValidator = (productUpdate) => {
  return valueProvided(productUpdate?.productId)
    && valueProvided(productUpdate?.updatePayload);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productUpdate', (productUpdate) => everyIfArray(productUpdateValidator, productUpdate)],
]);

const printifyProductUpdateSingle = async (
  credsPayload,
  productUpdate,
  {
    shopId,
  } = {},
) => {
  const {
    productId,
    updatePayload,
  } = productUpdate;

  return printifyClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/shops/${ shopId }/products/${ productId }.json`,
      body: updatePayload,
    },
    context: { credsPayload },
  });
};

const printifyProductUpdate = async (
  credsPayload,
  productUpdate,
  {
    shopId,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productUpdate,
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
    productUpdate,
    printifyProductUpdateSingle,
    (productUpdateItem) => ({
      args: [credsPayload, productUpdateItem, { shopId }],
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
  printifyProductUpdate,
  funcApiConfig,
};
