// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageDelete

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const orderIdentifierValidator = (orderIdentifier) => {
  return objHasAny(orderIdentifier, [
    'orderId', 
    'orderName',
  ]);
};

const fulfillmentPayloadValidator = (fulfillmentPayload) => {

  const { 
    all, 
    itemsBySku,
    // TODO: Support fulfilling items by line item id
    
  } = fulfillmentPayload;

  if (all === true) {
    return true;
  }

  if (itemsBySku) {
    return itemsBySku.every((item) => {
      return objHasAll(item, ['sku', 'quantity']);
    });
  }

  return false;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderIdentifier', orderIdentifierValidator],
  ['fulfillmentPayload', fulfillmentPayloadValidator],
]);

const shopifyOrderFulfill = async (
  credsPayload,
  orderIdentifier,
  fulfillmentPayload,
  {
    apiVersion,
    // TODO: Support return schema
    // returnSchema = 'deletedThingId',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderIdentifier,
    fulfillmentPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }
  
  return {
    ok: true,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyOrderFulfill,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyOrderFulfill" \
  -H "Content-Type: application/json" \
  -d `{
    "credsPayload": { "credsPath": "shopify.au" },
    "orderIdentifier": { "orderId": "104188477512" },
    "fulfillmentPayload": { 
      "all": true,
      "notifyCustomer": true,
      "originAddress": { "countryCode": "AU" },
      "trackingInfo": { 
        "number": "1234567890", 
        "company": "Kiki's Delivery Service", 
        "url": "https://www.studioghibli.com.au/kikisdeliveryservice" 
      }
    }
  }`
*/
