const { credsFromPayload, responseIfRejectingArgs, Getter, capitaliseString } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
};

const shopifyGetPacket = async (
  // options on the main function can become args on the packet get if they have defaults
  // TODO: Consider where defaults should lie
  creds,
  resource,
  resourcePlural,
  attrs,
  {
    cursor,
  } = {},
) => {
  return await shopifyClient.fetch({
    method: 'post',
    body: {
      query: `
        query ${ resourcePlural }Get($first: Int!, $after: String) {
          ${ resourcePlural }(first: $first, after: $after) {
            edges {
              node {
                ${ attrs }
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
      resultPath: `data.${ resourcePlural }`,
    },
  });
};

const shopifyGetPaginator = async (args, response) => {
  let [options, ...untouchedArgs] = args.reverse();
  untouchedArgs = untouchedArgs.reverse();

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
    ...untouchedArgs, 
    { 
      ...options, 
      cursor: endCursor, 
    },
  ]];
};

const shopifyGet = async (
  credsPayload,
  resource,
  {
    resourcePlural,
    attrs = 'id',
    ...getterOptions // e.g. limit
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { 
    credsPayload,
    resource,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const resources = [];

  const getter = new Getter(
    [
      creds,
      resource,
      resourcePlural,
      attrs,
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
    resources.push(...items);
  });

  getter.on('done', () => {
    console.log('done', resources.length);
  });

  await getter.run();

  return {
    ok: true,
    data: resources,
  };
};

const funcApiConfig = {
  argNames: [
    'credsPayload',
    'resource',
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
    "credsPayload": { "credsPath": "shopify.au" },
    "resource": "customers"
  }'

curl -X POST "http://localhost:8000/shopifyGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "resource": "customers",
    "options": {
      "limit": 10
    }
  }'
*/
