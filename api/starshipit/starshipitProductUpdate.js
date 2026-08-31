// https://api-docs.starshipit.com/#9101a9d7-91b1-492c-b7ad-5f92f80bbfd7

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitClient } = require('../starshipit/starshipit.utils');
const { starshipitProductsGet } = require('../starshipit/starshipitProductsGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productId'],
  ['sku'],
  ['updatePayload'],
]);

const starshipitProductUpdate = async (
  credsPayload,
  productId,
  sku,
  updatePayload,
  {
    setData = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productId,
    sku,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  if (!setData) {
    const productsResponse = await starshipitProductsGet(
      credsPayload,
      {
        searchTerm: sku,
      },
    );

    if (!productsResponse?.ok) {
      return productsResponse;
    }

    const currentProduct = productsResponse.data?.find(product => product?.sku === sku);
    if (!currentProduct) {
      return {
        ok: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: `No Starshipit product found for SKU ${ sku }`,
        },
      };
    }

    updatePayload = {
      ...currentProduct,
      ...updatePayload,
    };
  }

  return starshipitClient.fetch({
    requestPayload: {
      url: '/products/update',
      method: 'put',
      body: {
        id: productId,
        product: {
          id: productId,
          sku,
          ...updatePayload,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'result.product',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitProductUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitProductUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.wf" },
    "productId": 3015817,
    "sku": "WFAL48-1-S",
    "updatePayload": { "hs_code": "6104630011" }
  }'
*/
