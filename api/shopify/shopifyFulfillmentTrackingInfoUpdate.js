// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentTrackingInfoUpdate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const defaultReturnSchema = `
  fulfillment {
    id
    status
    trackingInfo {
      company
      number
      url
    }
  }
`;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fulfillmentId'],
  ['trackingInfoPayload'],
]);

const shopifyFulfillmentTrackingInfoUpdate = async (
  credsPayload,
  fulfillmentId,
  trackingInfoPayload,
  {
    apiVersion,
    returnSchema = defaultReturnSchema,
    notifyCustomer = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fulfillmentId,
    trackingInfoPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'fulfillmentTrackingInfoUpdate',
    {
      mutationVariables: {
        fulfillmentId: {
          type: 'ID!',
          value: `gid://shopify/Fulfillment/${ fulfillmentId }`,
        },
        trackingInfoInput: {
          type: 'FulfillmentTrackingInput!',
          value: trackingInfoPayload,
        },
        ...notifyCustomer && {
          notifyCustomer: {
            type: 'Boolean',
            value: notifyCustomer,
          },
        },
      },
      returnSchema,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyFulfillmentTrackingInfoUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyFulfillmentTrackingInfoUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "fulfillmentId": "104188477512",
    "trackingInfoPayload": {
      "company": "FastEx",
      "number": "123456789",
      "url": "https://track.example.com/123456789"
    }
  }'
*/
