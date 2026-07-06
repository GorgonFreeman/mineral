const { credsFromPayload, responseIfRejectingArgs, Getter, logDeep, askQuestion } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
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
    [{
      method: 'post',
      body: {
        query: `
          query CustomersGet(
            $first: Int!,
          ) {
            customers(
              first: $first,
            ) {
              edges {
                node {
                  id
                  email
                }
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
    }],
    {
      fetchClient: shopifyClient,
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
        return [true, paginatedArgs];
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
