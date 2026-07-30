// https://developers.printify.com/#create-a-new-product

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient, resolveShopIdFromCreds } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['title'],
  ['description'],
  ['blueprintId'],
  ['printProviderId'],
  ['variants'],
  ['printAreas'],
]);

const printifyProductCreate = async (
  credsPayload,
  title,
  description,
  blueprintId,
  printProviderId,
  variants,
  printAreas,
  {
    shopId,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    title,
    description,
    blueprintId,
    printProviderId,
    variants,
    printAreas,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopIdFromCreds({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

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

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyProductCreate,
  funcApiConfig,
};
