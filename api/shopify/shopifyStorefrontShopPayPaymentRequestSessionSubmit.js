// https://shopify.dev/docs/api/storefront/latest/mutations/shopPayPaymentRequestSessionSubmit

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['token'],
  ['paymentRequest'],
  ['idempotencyKey'],
]);

const shopifyStorefrontShopPayPaymentRequestSessionSubmit = async (
  credsPayload,
  token,
  paymentRequest,
  idempotencyKey,
  {
    apiVersion,
    orderName,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    token,
    paymentRequest,
    idempotencyKey,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'shopPayPaymentRequestSessionSubmit',
    {
      mutationVariables: {
        token: {
          type: 'String!',
          value: token,
        },
        paymentRequest: {
          type: 'ShopPayPaymentRequestInput!',
          value: paymentRequest,
        },
        idempotencyKey: {
          type: 'String!',
          value: idempotencyKey,
        },
        ...orderName !== undefined && {
          orderName: {
            type: 'String',
            value: orderName,
          },
        },
      },
      returnSchema: `
        paymentRequestReceipt {
          token
          processingStatusType
        }
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
  shopifyStorefrontShopPayPaymentRequestSessionSubmit,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontShopPayPaymentRequestSessionSubmit" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "token": "session-token",
    "paymentRequest": {
      "total": { "amount": "10.00", "currencyCode": "AUD" }
    },
    "idempotencyKey": "unique-key-123"
  }'
*/
