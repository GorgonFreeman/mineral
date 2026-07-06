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
    apiVersion,

    perPage = 250,
    cursor,
    queries,
    reverse,
    savedSearchId,
    sortKey,
    roles,
    names,
    constraintStatus,
    constraintSubtype,
    namespace,
    ownerType,
    pinnedStatus,
    ownerGid,
    includeClosed,
    includeLegacy,
    type,
    sku,
    argumentTypeOverrides = {},
  } = {},
) => {

  // Forgive me, this is a capital for legibility
  const Resource = capitaliseString(resource);
  const Resources = capitaliseString(resources);

  const queryTypeDeclaration = [
    '$first: Int!',
    '$cursor: String',
    ...queries ? ['$query: String,'] : [],
    ...reverse !== undefined ? ['$reverse: Boolean,'] : [],
    ...savedSearchId ? ['$savedSearchId: ID,'] : [],
    ...sortKey ? [`$sortKey: ${ Resource }SortKeys,`] : [],
    ...roles ? [`$roles: [${ Resource }Role!],`] : [],
    ...names ? ['$names: [String!],'] : [],
    ...constraintStatus ? ['$constraintStatus: MetafieldDefinitionConstraintStatus,'] : [],
    ...constraintSubtype ? ['$constraintSubtype: MetafieldDefinitionConstraintSubtypeIdentifier,'] : [],
    ...namespace ? ['$namespace: String,'] : [],
    ...ownerType ? ['$ownerType: MetafieldOwnerType!,'] : [],
    ...pinnedStatus ? ['$pinnedStatus: MetafieldDefinitionPinnedStatus,'] : [],
    ...ownerGid ? ['$owner: ID!,'] : [],
    ...includeClosed ? ['$includeClosed: Boolean,'] : [],
    ...includeLegacy ? ['$includeLegacy: Boolean,'] : [],
    ...type ? [`$type: ${ argumentTypeOverrides['type'] || 'String!' },`] : [],
    ...sku ? ['$sku: String,'] : [],
  ].join('\n');

  const queryVariableDeclaration = [
    'first: $first',
    'after: $cursor',
    ...queries ? ['query: $query'] : [],
    ...reverse !== undefined ? ['reverse: $reverse'] : [],
    ...savedSearchId ? ['savedSearchId: $savedSearchId'] : [],
    ...sortKey ? ['sortKey: $sortKey'] : [],
    ...roles ? ['roles: $roles'] : [],
    ...names ? ['names: $names'] : [],
    ...constraintStatus ? ['constraintStatus: $constraintStatus'] : [],
    ...constraintSubtype ? ['constraintSubtype: $constraintSubtype'] : [],
    ...namespace ? ['namespace: $namespace'] : [],
    ...ownerType ? ['ownerType: $ownerType'] : [],
    ...pinnedStatus ? ['pinnedStatus: $pinnedStatus'] : [],
    ...ownerGid ? ['owner: $owner'] : [],
    ...includeClosed ? ['includeClosed: $includeClosed'] : [],
    ...includeLegacy ? ['includeLegacy: $includeLegacy'] : [],
    ...type ? ['type: $type'] : [],
    ...sku ? ['sku: $sku'] : [],
  ].join('\n');

  const variables = {
    first: perPage,
    cursor,
    ...reverse !== undefined && { reverse },
    ...queries && { query: queries.join(' AND ') },
    ...savedSearchId && { savedSearchId: `gid://shopify/SavedSearch/${ savedSearchId }` },
    ...sortKey && { sortKey },
    ...roles && { roles },
    ...names && { names },
    ...constraintStatus && { constraintStatus },
    ...constraintSubtype && { constraintSubtype },
    ...namespace && { namespace },
    ...ownerType && { ownerType },
    ...pinnedStatus && { pinnedStatus },
    ...ownerGid && { owner: ownerGid },
    ...includeClosed && { includeClosed },
    ...includeLegacy && { includeLegacy },
    ...type && { type },
    ...sku && { sku },
  };

  return await shopifyClient.fetch({
    method: 'post',
    body: {
      query: `
        query Get${ Resources } (
          ${ queryTypeDeclaration }
        ) {
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
    context: {
      creds,
      apiVersion,
      resultPath: `data.${ resources }`,
    },
  });
};

const shopifyGetPaginator = async (currentParams, response) => {

  const { args, options } = currentParams;
  
  // Extract pagination info
  const { ok, meta } = response;
  const { pageInfo } = meta || {};
  const { hasNextPage, endCursor } = pageInfo || {};

  if (!ok) {
    return [true];
  }
  
  // Check if done
  if (!hasNextPage) {
    return [true];
  }
  
  // Supplement params with pagination info
  const paginatedParams = {
    args,
    options: { 
      ...options,
      cursor: endCursor,
    },
  };

  return [false, paginatedParams];
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
    apiVersion,

    // Related to the actual query
    perPage = 250,
    cursor,
    attrs = 'id',
    queries,
    reverse,
    savedSearchId,
    sortKey,
    // https://shopify.dev/docs/api/admin-graphql/latest/queries/themes#arguments-names
    roles,
    names,
    // https://shopify.dev/docs/api/admin-graphql/unstable/queries/metafielddefinitions
    constraintStatus,
    constraintSubtype,
    namespace,
    ownerType,
    pinnedStatus,
    // https://shopify.dev/docs/api/admin-graphql/unstable/queries/metafields#arguments-owner
    ownerGid,
    // https://shopify.dev/docs/api/admin-graphql/latest/objects/fulfillmentOrder#queries
    includeClosed,
    // https://shopify.dev/docs/api/admin-graphql/latest/queries/locations#arguments-includeLegacy
    includeLegacy,
    // https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobjects
    type,
    // https://shopify.dev/docs/api/admin-graphql/latest/queries/inventoryItems
    sku,
    
    // Helpers
    resources = `${ resource }s`, // for when plural of the resource isn't `${ resource }s`
    argumentTypeOverrides = {}, // for when a commonly-named API option is not just a single type, e.g. type being String vs CatalogType

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
        attrs,
      ],
      options: {
        apiVersion,
        perPage,
        cursor,
        queries,
        reverse,
        savedSearchId,
        sortKey,
        roles,
        names,
        constraintStatus,
        constraintSubtype,
        namespace,
        ownerType,
        pinnedStatus,
        ownerGid,
        includeClosed,
        includeLegacy,
        type,
        sku,
        argumentTypeOverrides,
      },
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
  shopifyGet: (...args) => shopifyGet(false, ...args),
  shopifyGetter: (...args) => shopifyGet(true, ...args),
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
