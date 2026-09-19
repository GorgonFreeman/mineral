// https://shopify.dev/docs/api/storefront/latest/mutations/shopPayPaymentRequestSessionCreate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const defaultReturnSessionAttrs = `
  id
  sourceIdentifier
  checkoutUrl
  paymentRequest {
    total {
      amount
      currencyCode
    }
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sourceIdentifier'],
  ['paymentRequest'],
]);

const shopifyStorefrontShopPayPaymentRequestSessionCreate = async (
  credsPayload,
  sourceIdentifier,
  paymentRequest,
  {
    apiVersion,
    returnSessionAttrs = defaultReturnSessionAttrs,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sourceIdentifier,
    paymentRequest,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'shopPayPaymentRequestSessionCreate',
    {
      mutationVariables: {
        sourceIdentifier: {
          type: 'String!',
          value: sourceIdentifier,
        },
        paymentRequest: {
          type: 'ShopPayPaymentRequestInput!',
          value: paymentRequest,
        },
      },
      returnSchema: `
        shopPayPaymentRequestSession { ${ returnSessionAttrs } }
        userErrors { field message code }
      `.trim(),
      apiVersion,
      inContext,
      ...fetchClient ? { fetchClient } : {},
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontShopPayPaymentRequestSessionCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontShopPayPaymentRequestSessionCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "sourceIdentifier": "order-123",
    "paymentRequest": {
      "total": { "amount": "10.00", "currencyCode": "AUD" },
      "lineItems": [{ "label": "Item", "amount": { "amount": "10.00", "currencyCode": "AUD" }, "quantity": 1 }]
    }
  }'
*/
