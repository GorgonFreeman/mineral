const { credsFromPayload, responseIfRejectingArgs, Getter, logDeep, askQuestion } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
};

const shopifyCustomersGetPage = async (
  creds,
) => {
  return await shopifyClient.fetch({
    method: 'post',
    body: {
      query: `
        query CustomersGetPage($first: Int!) {
          customers(first: $first) {
            edges {
              node {
                id
                email
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      variables: {
        first: 250,
      },
    },
    context: {
      creds,
      resultPath: 'data.customers',
    },
  });
};

const shopifyCustomersGet = async (
  credsPayload,
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { 
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const customers = [];

  const getter = new Getter(
    [
      creds,
    ],
    {
      func: shopifyCustomersGetPage,
      digester: (response) => {
        const { ok, data } = response;

        if (!ok) {
          return null; // TODO: Consider a way to break out as this is an error
        }

        return data;
      },
      paginator: async (paginatedArgs, response) => {
        logDeep(paginatedArgs, response);
        await askQuestion('?');
        return [false, paginatedArgs];
      },
    },
  );

  getter.on('items', (items) => {
    console.log('items', items.length);
    customers.push(...items);
  });

  getter.on('done', () => {
    console.log('done', customers.length);
  });

  await getter.run();

  return {
    ok: true,
    data: customers,
  };
};

const funcApiConfig = {
  argNames: [
    'credsPayload',
  ],
  validatorsByArg,
};

module.exports = {
  shopifyCustomersGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCustomersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" }
  }'
*/
