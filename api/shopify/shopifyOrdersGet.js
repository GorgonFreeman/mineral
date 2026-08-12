const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyOrdersGet = async (
  credsPayload,
  {
    first = 50,
    after,
    query,
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await shopifyClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
        query OrdersGet(
          $first: Int!,
          $after: String,
          $query: String
        ) {
          orders(
            first: $first,
            after: $after,
            query: $query
          ) {
            edges {
              node {
                id
                name
                createdAt
                displayFinancialStatus
                displayFulfillmentStatus
              }
            }
          }
        }
      `,
        variables: {
          first,
          after,
          query,
        },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.orders',
    },
  });

  if (!response.ok) {
    return response;
  }

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyOrdersGet,
  funcApiConfig,
};
