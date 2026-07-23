// https://api-docs.starshipit.com/#5edb43f1-432b-4d1a-bb31-e05db0c879e3

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const productIdsValidator = (productIds) => Array.isArray(productIds) && productIds.length > 0;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productIds', productIdsValidator],
]);

const starshipitProductsDelete = async (
  credsPayload,
  productIds,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productIds,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return starshipitClient.fetch({
    requestPayload: {
      url: '/products/delete',
      method: 'delete',
      body: {
        product_ids: productIds,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitProductsDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitProductsDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" },
    "productIds": [5585356]
  }'
*/
