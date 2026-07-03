const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = 'id name createdAt displayFinancialStatus displayFulfillmentStatus';

const validatorsByArg = {
  credsPayload: credsValidator,
  orderIdentifier: ({ orderId, orderName } = {}) => Boolean(orderId) || Boolean(orderName),
};

const shopifyOrderGet = async (
  credsPayload,
  orderIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, orderIdentifier });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { orderId, orderName } = orderIdentifier;

  if (orderId) {
    return shopifyGetSingle(
      credsPayload,
      'order',
      orderId,
      {
        apiVersion,
        attrs,
      },
    );
  }

  /* orderName */
  // const response = await shopifyOrdersGet(credsPath, {
  //   apiVersion,
  //   attrs,
  //   queries: [`name:${ orderName }`],
  // });

  // const singleResponse = standardInterpreters.expectOne(response);

  // return singleResponse;
  /* /orderName */
};

const funcApiConfig = {
  argNames: ['credsPayload', 'orderIdentifier'],
  validatorsByArg,
};

module.exports = {
  shopifyOrderGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyOrderGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsObject": {
        "STORE_HANDLE": "arisawa-heavy-industries",
        "API_KEY": "shpat_xxx"
      }
    },
    "orderIdentifier": {
      "orderId": "1234567890"
    }
  }'

curl -X POST "http://localhost:8000/shopifyOrderGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "shopify.au"
    },
    "orderIdentifier": {
      "orderId": "7015155466312"
    }
  }'
*/
