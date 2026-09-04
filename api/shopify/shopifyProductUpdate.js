// https://shopify.dev/docs/api/admin-graphql/latest/mutations/productUpdate

const { credsValidator } = require('../validators');
const {
  actionSingleOrMultiple,
  everyIfArray,
  ArgsWarden,
  valueProvided,
} = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const productUpdateValidator = (productUpdate) => {
  const {
    productIdentifier,
    media,
    product,
  } = productUpdate || {};

  return valueProvided(productIdentifier) && (media || product);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productUpdate', (p) => everyIfArray(productUpdateValidator, p)],
]);

const defaultReturnProductAttrs = 'id handle';

const shopifyProductUpdateSingle = async (
  credsPayload,
  productUpdate,
  {
    apiVersion,
    returnProductAttrs = defaultReturnProductAttrs,
  } = {},
) => {

  const {
    productIdentifier,
    media,
    product,
  } = productUpdate;

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
  productUpdate,
  {
    queueRunOptions,
    apiVersion,
    returnProductAttrs = defaultReturnProductAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productUpdate,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    [productUpdate],
    shopifyProductUpdateSingle,
    (productUpdateItem) => ({
      args: [
        credsPayload,
        productUpdateItem,
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
    "productUpdate": {
      "productIdentifier": "104188477512",
      "product": {
        "title": "Example"
      }
    }
  }'
*/
