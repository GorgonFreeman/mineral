// https://shopify.dev/docs/api/admin-graphql/latest/mutations/productUpdate

const { credsValidator } = require('../validators');
const {
  actionSingleOrMultiple,
  everyIfArray,
  ArgsWarden,
  valueProvided,
} = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const updatePayloadValidator = (updatePayload) => {
  return updatePayload?.media || updatePayload?.product;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productIdentifier', (i) => everyIfArray(valueProvided, i)],
  ['updatePayload', (i) => everyIfArray(updatePayloadValidator, i)],
]);

const defaultReturnProductAttrs = 'id handle';

const shopifyProductUpdateSingle = async (
  credsPayload,
  productIdentifier,
  updatePayload,
  {
    apiVersion,
    returnProductAttrs = defaultReturnProductAttrs,
  } = {},
) => {

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

const shopifyProductUpdate = async (
  credsPayload,
  productIdentifier,
  updatePayload,
  {
    queueRunOptions,
    apiVersion,
    returnProductAttrs = defaultReturnProductAttrs,
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

  return actionSingleOrMultiple(
    [productIdentifier, updatePayload],
    shopifyProductUpdateSingle,
    (productIdentifierItem, updatePayloadItem) => ({
      args: [
        credsPayload,
        productIdentifierItem,
        updatePayloadItem,
        {
          apiVersion,
          returnProductAttrs,
        },
      ],
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
  shopifyProductUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyProductUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "productIdentifier": "104188477512",
    "updatePayload": {
      "product": {
        "title": "Example"
      }
    }
  }'
*/
