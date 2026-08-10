const { credsValidator } = require('../validators');
const { ArgsWarden, operationQueueRunner, logDeep, askQuestion } = require('../utils');
const { objHasAny } = require('../utils');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { shopifyFulfillmentCreate } = require('../shopify/shopifyFulfillmentCreate');

const orderIdentifierValidator = (orderIdentifier) => {
  return objHasAny(orderIdentifier, [
    'orderId', 
    'orderName',
  ]);
};

const fulfillmentPayloadValidator = (fulfillmentPayload) => {

  const { 
    fulfillAll, 
    itemsBySku,
    // TODO: Support fulfilling items by line item id
    
  } = fulfillmentPayload;

  if (fulfillAll === true) {
    return true;
  }

  if (itemsBySku) {
    const quantities = Object.values(itemsBySku);
    return quantities.length > 0 && quantities.every(quantity => typeof quantity === 'number');
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

  const {
    fulfillAll = false,
    itemsBySku,
    notifyCustomer = false,
    originAddress,
    trackingInfo,
  } = fulfillmentPayload;

  const fetchFulfillmentOrdersLimit = 10;
  const fetchFulfillmentsLimit = 10;
  const fetchTrackingInfoLimit = 10;
  const fetchLineItemsLimit = 250;

  const openFulfillmentOrdersQuery = `displayable:true AND (request_status:UNSUBMITTED OR request_status:ACCEPTED)`;

  const ORDER_ATTRS = `
    fulfillable
    fulfillments(first: ${ fetchFulfillmentsLimit }) {
      trackingInfo(first: ${ fetchTrackingInfoLimit }) {
        number
      }
    }
    fulfillmentOrders(first: ${ fetchFulfillmentOrdersLimit }, query: "${ openFulfillmentOrdersQuery }") {
      edges {
        node {
          id
          requestStatus
          ${ itemsBySku ? `
            lineItems (first: ${ fetchLineItemsLimit }) {
              edges {
                node {
                  id
                  sku
                  remainingQuantity
                  requiresShipping
                }
              }
            }
          ` : '' }
        }
      }
    }
  `;

  // Get open fulfillment orders
  const orderResponse = await shopifyOrderGet(
    credsPayload,
    orderIdentifier,
    {
      apiVersion,
      attrs: ORDER_ATTRS,
    },
  );

  const { ok: orderOk, data: order } = orderResponse;
  if (!orderOk || !order) {
    return orderResponse;
  }

  const {
    fulfillable,
    fulfillments,
    fulfillmentOrders,
  } = order;

  if (fulfillments.length >= fetchFulfillmentsLimit) {
    return {
      ok: false,
      error: {
        code: 'LIMIT_REACHED',
        message: `We retrieved ${ fetchFulfillmentsLimit } fulfillments, so there may be more. Please adjust the function.`,
      },
      data: order,
    };
  }

  if (fulfillments.some(f => f?.trackingInfo?.length > fetchTrackingInfoLimit)) {
    return {
      ok: false,
      error: {
        code: 'LIMIT_REACHED',
        message: `We retrieved ${ fetchTrackingInfoLimit } tracking info, so there may be more. Please adjust the function.`,
      },
      data: order,
    };
  }

  if (fulfillmentOrders.length >= fetchFulfillmentOrdersLimit) {
    return {
      ok: false,
      error: {
        code: 'LIMIT_REACHED',
        message: `We retrieved ${ fetchFulfillmentOrdersLimit } open fulfillment orders, so there may be more. Please adjust the function.`,
      },
      data: order,
    };
  }

  if (!fulfillable) {
    return {
      ok: false,
      error: 'Order is not fulfillable',
      data: order,
    };
  }

  const seenTrackingNumbers = fulfillments.map(f => f?.trackingInfo?.map(t => t.number)).flat().filter(Boolean);

  if (trackingInfo?.number && seenTrackingNumbers.includes(trackingInfo.number)) {
    return {
      ok: true,
      meta: {
        alreadyFulfilled: true,
        trackingNumber: trackingInfo.number,
      },
    };
  }
  
  // if using fulfillAll, fulfill them
  if (fulfillAll === true) {
    return shopifyFulfillmentCreate(
      credsPayload,
      fulfillmentOrders.map(fulfillmentOrder => {
        const {
          id: fulfillmentOrderGid,
        } = fulfillmentOrder;

        return {
          lineItemsByFulfillmentOrder: [{
            fulfillmentOrderId: fulfillmentOrderGid,
          }],
          notifyCustomer,
          originAddress,
          trackingInfo,
        };
      }),
      {
        apiVersion,
      },
    );
  }
  
  // if using itemsBySku, iterate over unfulfilled line items and decrement until complete, making a queue of fulfillments to action
  if (itemsBySku) {
    const depletableItemsBySku = { ...itemsBySku };
    const shopifyFulfillmentCreatePayloads = [];

    for (const fulfillmentOrder of fulfillmentOrders) {
      const {
        id: fulfillmentOrderGid,
        lineItems = [],
      } = fulfillmentOrder;

      if (lineItems.length >= fetchLineItemsLimit) {
        return {
          ok: false,
          error: {
            code: 'LIMIT_REACHED',
            message: `We retrieved ${ fetchLineItemsLimit } line items on a fulfillment order, so there may be more. Please adjust the function.`,
          },
          data: order,
        };
      }

      const fulfillmentOrderLineItems = [];

      for (const lineItem of lineItems) {
        const {
          id: lineItemGid,
          sku,
          remainingQuantity,
          requiresShipping,
        } = lineItem;

        if (!requiresShipping || remainingQuantity <= 0) {
          continue;
        }

        const depletableQuantity = depletableItemsBySku[sku];
        if (!depletableQuantity) {
          continue;
        }

        const quantity = Math.min(remainingQuantity, depletableQuantity);
        fulfillmentOrderLineItems.push({
          id: lineItemGid,
          quantity,
        });
        depletableItemsBySku[sku] -= quantity;
      }

      if (fulfillmentOrderLineItems.length > 0) {
        shopifyFulfillmentCreatePayloads.push([
          credsPayload,
          {
            lineItemsByFulfillmentOrder: [{
              fulfillmentOrderId: fulfillmentOrderGid,
              fulfillmentOrderLineItems,
            }],
            notifyCustomer,
            originAddress,
            trackingInfo,
          },
          {
            apiVersion,
          },
        ]);
      }
    }

    if (shopifyFulfillmentCreatePayloads.length === 0) {
      return {
        ok: false,
        error: {
          message: 'No fulfillable line items found',
        },
        data: order,
      };
    }

    logDeep({ depletableItemsBySku, shopifyFulfillmentCreatePayloads });
    await askQuestion('Continue?');

    return operationQueueRunner(
      shopifyFulfillmentCreate,
      shopifyFulfillmentCreatePayloads,
    );
  }

  return {
    ok: false,
    error: `I guess we don't do that yet`,
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
      "fulfillAll": true,
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
