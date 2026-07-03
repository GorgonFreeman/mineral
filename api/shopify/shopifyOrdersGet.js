const { credsFromPayload, logDeep, responseIfRejectingArgs } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
};

const shopifyOrdersGet = async (
  credsPayload,
  {
    first = 50,
    after,
    query,
    apiVersion,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const response = await shopifyClient.fetch({
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
    context: {
      creds,
      apiVersion,
      resultPath: 'data.orders',
    },
  });

  if (!response.ok) {
    return response;
  }

  logDeep('response', response);
  return response;
};

const funcApiConfig = {
  argNames: ['credsPayload'],
  validatorsByArg,
};

module.exports = {
  shopifyOrdersGet,
  funcApiConfig,
};
