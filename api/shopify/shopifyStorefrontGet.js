const { Getter, capitaliseString, ArgsWarden, getWithLocalCachedFile } = require('../utils');
const { credsValidator } = require('../validators');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');
const { MAX_PER_PAGE } = require('./shopify.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['resource'],
]);

const shopifyStorefrontGetPacket = async (
  credsPayload,
  resource,
  resources,
  attrs,
  {
    apiVersion,
    perPage = MAX_PER_PAGE,
    cursor,
    queries,
    reverse,
    sortKey,
    type,
    inContext,
    sortKeyType,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const Resource = capitaliseString(resource);
  const Resources = capitaliseString(resources);
  const resolvedSortKeyType = sortKeyType || `${ Resource }SortKeys`;

  const queryTypeDeclaration = [
    '$first: Int!',
    '$cursor: String',
    ...queries ? ['$query: String'] : [],
    ...reverse !== undefined ? ['$reverse: Boolean'] : [],
    ...sortKey ? [`$sortKey: ${ resolvedSortKeyType }`] : [],
    ...type ? ['$type: String!'] : [],
  ].join('\n');

  const queryVariableDeclaration = [
    'first: $first',
    'after: $cursor',
    ...queries ? ['query: $query'] : [],
    ...reverse !== undefined ? ['reverse: $reverse'] : [],
    ...sortKey ? ['sortKey: $sortKey'] : [],
    ...type ? ['type: $type'] : [],
  ].join('\n');

  const variables = {
    first: perPage,
    cursor,
    ...reverse !== undefined && { reverse },
    ...queries && { query: queries.join(' AND ') },
    ...sortKey && { sortKey },
    ...type && { type },
  };

  const inContextDirective = buildInContextDirective(inContext);

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query StorefrontGet${ Resources } (
            ${ queryTypeDeclaration }
          )${ inContextDirective } {
            ${ resources }(
              ${ queryVariableDeclaration }
            ) {
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
        variables,
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: `data.${ resources }`,
    },
  });
};

const shopifyStorefrontGetPaginator = async (currentParams, response) => {
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

const shopifyStorefrontGetDigester = (response) => {
  const { ok, data } = response;

  if (!ok) {
    return null;
  }

  return data;
};

const shopifyStorefrontGet = async (
  returnGetter,

  credsPayload,
  resource,
  {
    apiVersion,
    perPage = MAX_PER_PAGE,
    cursor,
    attrs = 'id',
    queries,
    reverse,
    sortKey,
    type,
    inContext,
    sortKeyType,
    resources = `${ resource }s`,
    useLocalCachedFile,
    fetchClient = shopifyStorefrontClient,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    resource,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getter = new Getter(
    {
      args: [
        credsPayload,
        resource,
        resources,
        attrs,
      ],
      options: {
        apiVersion,
        perPage,
        cursor,
        queries,
        reverse,
        sortKey,
        type,
        inContext,
        sortKeyType,
        fetchClient,
      },
    },
    {
      func: shopifyStorefrontGetPacket,
      digester: shopifyStorefrontGetDigester,
      paginator: shopifyStorefrontGetPaginator,
      ...getterOptions,
    },
  );

  if (returnGetter) {
    return getter;
  }

  return getWithLocalCachedFile(
    useLocalCachedFile,
    async () => {
      const data = await getter.run({ returnAll: true });

      return {
        ok: true,
        data,
      };
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontGet: (...args) => shopifyStorefrontGet(false, ...args),
  shopifyStorefrontGetter: (...args) => shopifyStorefrontGet(true, ...args),
  shopifyStorefrontGetPaginator,
  shopifyStorefrontGetDigester,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "resource": "product",
    "options": {
      "limit": 5,
      "attrs": "id handle title"
    }
  }'
*/
