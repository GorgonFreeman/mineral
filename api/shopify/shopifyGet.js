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
  resources,
  attrs,
  {
    cursor,
  } = {},
) => {

  // Forgive me, this is a capital for legibility
  const Resource = capitaliseString(resource);
  const Resources = capitaliseString(resources);

  return await shopifyClient.fetch({
    method: 'post',
    body: {
      query: `
        query ${ Resources }Get($first: Int!, $after: String) {
          ${ resources }(first: $first, after: $after) {
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
      resultPath: `data.${ resources }`,
    },
  });
};

const shopifyGetPaginator = async (currentParams, response) => {

  const { args, options } = currentParams;

  const { ok, meta } = response;
  const { pageInfo } = meta || {};
  const { hasNextPage, endCursor } = pageInfo || {};

  if (!ok) {
    return [true];
  }

  if (!hasNextPage) {
    return [true];
  }

  return [false, {
    args,
    options: { 
      ...options,
      cursor: endCursor,
    },
  }];
};

const shopifyGetDigester = (response) => {
  const { ok, data } = response;

  if (!ok) {
    return null; // TODO: Consider a way to break out as this is an error
  }

  return data;
};

const shopifyGet = async (
  returnGetter, // Always bound

  credsPayload,
  resource,
  {
    resources = `${ resource }s`,
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

  const getter = new Getter(
    {
      args: [
        creds, 
        resource, 
        resources, 
        attrs
      ],
    },
    {
      func: shopifyGetPacket,
      digester: shopifyGetDigester,
      paginator: shopifyGetPaginator,
      ...getterOptions,
    },
  );
  
  if (returnGetter) {
    return getter;
  }

  return await getter.run({ returnAll: true });
};

const funcApiConfig = {
  argNames: [
    'credsPayload',
    'resource',
  ],
  validatorsByArg,
};

module.exports = {
  shopifyGet: shopifyGet.bind(null, false),
  shopifyGetter: shopifyGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "resource": "customer"
  }'

curl -X POST "http://localhost:8000/shopifyGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "resource": "customer",
    "options": {
      "limit": 10
    }
  }'
*/
