// https://shopify.dev/docs/api/admin-graphql/latest/mutations/productUpdate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const updatePayloadValidator = (updatePayload) => {
  return updatePayload?.media || updatePayload?.product;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productIdentifier'],
  ['updatePayload', updatePayloadValidator],
]);

const shopifyProductUpdate = async (
  credsPayload,
  productIdentifier,
  updatePayload,
  {
    apiVersion,
    returnProductAttrs = 'id handle',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productIdentifier,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { media, product } = updatePayload;

  return shopifyMutationDo(
    credsPayload,
    'productUpdate',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: `gid://shopify/Product/${ productIdentifier }`,
        },
        ...(product && { product: {
          type: 'ProductUpdateInput!',
          value: product,
        }}),
        ...(media && { media: {
          type: '[CreateMediaInput!]',
          value: media,
        }}),
      },
      returnSchema: `product { ${ returnProductAttrs } }`,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyProductUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyProductUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "thingId": "104188477512"
  }'
*/
