// "Artificially" fires a product update webhook by appending a space to the product title, which Shopify strips.

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');

const { shopifyProductGet, productIdentifierValidator } = require('../shopify/shopifyProductGet');
const { shopifyProductUpdate } = require('../shopify/shopifyProductUpdate');

const productPayloadValidator = (productPayload) => {
  const { productIdentifier, productTitle } = productPayload;
  return productIdentifierValidator(productIdentifier);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productPayload', productPayloadValidator],
]);

const shopifyProductUpdateTrigger = async (
  credsPayload,
  productPayload,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { 
    productIdentifier,
    productTitle,
  } = productPayload;

  if (!productTitle) {
    const productResponse = await shopifyProductGet(
      credsPayload,
      productPayload,
      {
        attrs: 'title',
      },
    );
    
    const {
      ok: productOk,
      data: productData,
    } = productResponse;
    if (!productOk) {
      return productResponse;
    }

    ({ title: productTitle } = productData);
  }

  if (!productTitle) {
    return {
      ok: false,
      error: 'Product title not found',
    };
  }

  return shopifyProductUpdate(
    credsPayload,
    {
      productIdentifier,
      product: {
        title: `${ productTitle } `,
      },
    },
    {
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyProductUpdateTrigger,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/shopifyProductUpdateTrigger" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "shopify.au" },
      "productPayload": { "productIdentifier": { "productId": "1234567890" } }
    }'

  curl -X POST "http://localhost:8000/shopifyProductUpdateTrigger" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "shopify.au" },
      "productPayload": { "productIdentifier": { "productId": "1234567890" }, "productTitle": "Ultra Strength Freeze Ray" },
    }'
*/
