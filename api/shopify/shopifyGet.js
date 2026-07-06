const { credsFromPayload, responseIfRejectingArgs, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
};

const shopifyGetPacket = async (
  creds,
  {
    cursor,
  } = {},
) => {
  return await shopifyClient.fetch({
    method: 'post',
    body: {
      query: `
        query CustomersGet($first: Int!, $after: String) {
          customers(first: $first, after: $after) {
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
        ...(cursor ? { after: cursor } : {}),
      },
    },
    context: {
      creds,
      resultPath: 'data.customers',
    },
  });
};

const shopifyGetPaginator = async (args, response) => {
  const [creds, options] = args;

  const { ok, meta } = response;
  const { pageInfo } = meta || {};
  const { hasNextPage, endCursor } = pageInfo || {};

  if (!ok) {
    return [true];
  }

  if (!hasNextPage) {
    return [true];
  }

  return [false, [
    creds, 
    { 
      ...options, 
      cursor: endCursor, 
    },
  ]];
};

const shopifyGet = async (
  credsPayload,
  {
    ...getterOptions // e.g. limit
  } = {},
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
      func: shopifyGetPacket,
      digester: (response) => {
        const { ok, data } = response;

        if (!ok) {
          return null; // TODO: Consider a way to break out as this is an error
        }

        return data;
      },
      paginator: shopifyGetPaginator,
      ...getterOptions,
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
  shopifyGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" }
  }'

curl -X POST "http://localhost:8000/shopifyGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "limit": 10
    }
  }'
*/
