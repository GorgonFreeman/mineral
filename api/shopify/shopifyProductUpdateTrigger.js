// "Artificially" fires a product update webhook by appending a space to the product title, which Shopify strips.

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');

const { shopifyProductGet, productIdentifierValidator } = require('../shopify/shopifyProductGet');
const { shopifyProductUpdate } = require('../shopify/shopifyProductUpdate');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productIdentifier', productIdentifierValidator],
]);

const shopifyProductUpdateTrigger = async (
  credsPayload,
  productIdentifier,
  {
    apiVersion,
    productTitle,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  if (!productTitle) {
    const productResponse = await shopifyProductGet(
      credsPayload,
      productIdentifier,
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

  // return shopifyProductUpdate(
  //   credsPayload,
  //   productIdentifier,
  //   apiVersion,
  // );
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
    "thingId": "104188477512"
  }'
*/
