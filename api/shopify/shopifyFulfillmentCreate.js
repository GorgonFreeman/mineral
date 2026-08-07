// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentCreate

const { credsValidator } = require('../validators');
const { ArgsWarden, valueProvided } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const fulfillmentInputValidator = (fulfillmentInput) => {
  const { lineItemsByFulfillmentOrder } = fulfillmentInput || {};
  if (!Array.isArray(lineItemsByFulfillmentOrder) || lineItemsByFulfillmentOrder.length === 0) {
    return false;
  }

  return lineItemsByFulfillmentOrder.every((item) => {
    if (!item?.fulfillmentOrderId) {
      return false;
    }

    if (item.fulfillmentOrderLineItems) {
      return item.fulfillmentOrderLineItems.every((lineItem) => {
        return lineItem?.id && valueProvided(lineItem?.quantity);
      });
    }

    return true;
  });
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fulfillmentInput', fulfillmentInputValidator],
]);

const defaultReturnFulfillmentAttrs = `
  id
  status
  trackingInfo {
    number
    company
    url
  }
`.trim();

const shopifyFulfillmentCreate = async (
  credsPayload,
  fulfillmentInput,
  {
    apiVersion,
    message,
    returnFulfillmentAttrs = defaultReturnFulfillmentAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fulfillmentInput,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'fulfillmentCreate',
    {
      mutationVariables: {
        fulfillment: {
          type: 'FulfillmentInput!',
          value: fulfillmentInput,
        },
        ...(valueProvided(message) && {
          message: {
            type: 'String',
            value: message,
          },
        }),
      },
      returnSchema: `
        fulfillment { ${ returnFulfillmentAttrs } }
      `.trim(),
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyFulfillmentCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyFulfillmentCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "fulfillmentInput": {
      "lineItemsByFulfillmentOrder": [
        {
          "fulfillmentOrderId": "gid://shopify/FulfillmentOrder/1234567890"
        }
      ],
      "notifyCustomer": true,
      "trackingInfo": {
        "number": "1234567890",
        "company": "Australia Post",
        "url": "https://auspost.com.au/mypost/track/details/1234567890"
      }
    }
  }'

curl -X POST "http://localhost:8000/shopifyFulfillmentCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "fulfillmentInput": {
      "lineItemsByFulfillmentOrder": [
        {
          "fulfillmentOrderId": "gid://shopify/FulfillmentOrder/1234567890",
          "fulfillmentOrderLineItems": [
            {
              "id": "gid://shopify/FulfillmentOrderLineItem/9876543210",
              "quantity": 1
            }
          ]
        }
      ],
      "notifyCustomer": false,
      "originAddress": {
        "countryCode": "AU"
      }
    },
    "options": {
      "message": "Partial fulfillment"
    }
  }'
*/
