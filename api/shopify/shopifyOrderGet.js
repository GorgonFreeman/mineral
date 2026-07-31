const { credsValidator } = require('../validators');
const { actionSingleOrMultiple, everyIfArray, ArgsWarden } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = 'id name createdAt displayFinancialStatus displayFulfillmentStatus';

const orderIdentifierValidator = ({ orderId, orderName } = {}) => Boolean(orderId) || Boolean(orderName);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderIdentifier', (i) => everyIfArray(orderIdentifierValidator, i)],
]);

const shopifyOrderGetSingle = async (
  credsPayload,
  orderIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

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

const shopifyOrderGet = async (
  credsPayload,
  orderIdentifier,
  {
    queueRunOptions,
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    orderIdentifier,
    shopifyOrderGetSingle,
    (identifier) => ({
      args: [credsPayload, identifier, { apiVersion, attrs }],
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

curl -X POST "http://localhost:8000/shopifyOrderGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "shopify.au"
    },
    "orderIdentifier": [
      { "orderId": "7015155466312" },
      { "orderId": "7697048109128" }
    ]
  }'
*/
