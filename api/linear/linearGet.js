// https://linear.app/developers/graphql

const { ArgsWarden, Getter, capitaliseString } = require('../utils');
const { credsValidator } = require('../validators');
const { MAX_PER_PAGE } = require('../linear/linear.constants');
const {
  linearClient,
  linearConnectionDigester,
  linearConnectionPaginator,
} = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['resource'],
]);

const linearGetPacket = async (
  credsPayload,
  resource,
  resources,
  attrs,
  {
    filter,
    filterType,
    before,
    after,
    last,
    includeArchived,
    orderBy,
    sort,
    sortType,
    includeDisabled,
    supportsIncludeDisabled = false,
    perPage = MAX_PER_PAGE,
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {
  const Resource = capitaliseString(resource);
  const Resources = capitaliseString(resources);
  const resolvedFilterType = filterType === undefined
    ? `${ Resource }Filter`
    : filterType;
  const resolvedSortType = sortType === true
    ? `${ Resource }SortInput`
    : sortType;
  const includeFilter = Boolean(resolvedFilterType);
  const includeSort = Boolean(resolvedSortType);
  const includeIncludeDisabled = supportsIncludeDisabled || includeDisabled !== undefined;

  const queryTypeDeclaration = [
    ...includeFilter ? [`$filter: ${ resolvedFilterType }`] : [],
    ...includeIncludeDisabled ? ['$includeDisabled: Boolean'] : [],
    '$before: String',
    '$after: String',
    '$first: Int',
    '$last: Int',
    '$includeArchived: Boolean',
    '$orderBy: PaginationOrderBy',
    ...includeSort ? [`$sort: [${ resolvedSortType }!]`] : [],
  ].join('\n');

  const queryVariableDeclaration = [
    ...includeFilter ? ['filter: $filter'] : [],
    ...includeIncludeDisabled ? ['includeDisabled: $includeDisabled'] : [],
    'before: $before',
    'after: $after',
    'first: $first',
    'last: $last',
    'includeArchived: $includeArchived',
    'orderBy: $orderBy',
    ...includeSort ? ['sort: $sort'] : [],
  ].join('\n');

  return fetchClient.fetch({
    requestPayload: {
      body: {
        query: `
          query ${ Resources }Get(
            ${ queryTypeDeclaration }
          ) {
            ${ resources }(
              ${ queryVariableDeclaration }
            ) {
              nodes {
                ${ attrs }
              }
              pageInfo {
                hasNextPage
                endCursor
                hasPreviousPage
                startCursor
              }
            }
          }
        `,
        variables: {
          ...includeFilter && { filter },
          ...includeIncludeDisabled && { includeDisabled },
          before,
          after,
          first: Math.min(perPage, MAX_PER_PAGE),
          last,
          includeArchived,
          orderBy,
          ...includeSort && { sort },
        },
      },
    },
    context: {
      credsPayload,
      resultPath: `data.${ resources }`,
    },
    inspect,
  });
};

const linearGet = async (
  returnGetter, // Always bound

  credsPayload,
  resource,
  {
    attrs = 'id',
    resources = `${ resource }s`,
    filter,
    filterType,
    before,
    after,
    last,
    includeArchived,
    orderBy,
    sort,
    sortType,
    includeDisabled,
    supportsIncludeDisabled = false,
    perPage = MAX_PER_PAGE,
    inspect = false,
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
        filter,
        filterType,
        before,
        after,
        last,
        includeArchived,
        orderBy,
        sort,
        sortType,
        includeDisabled,
        supportsIncludeDisabled,
        perPage,
        inspect,
        ...getterOptions,
      },
    },
    {
      func: linearGetPacket,
      digester: linearConnectionDigester,
      paginator: linearConnectionPaginator,
      ...getterOptions,
    },
  );

  if (returnGetter) {
    return getter;
  }

  const data = await getter.run({ returnAll: true });

  return {
    ok: true,
    data,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearGet: linearGet.bind(null, false),
  linearGetter: linearGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "resource": "issue",
    "options": {
      "limit": 5,
      "attrs": "id identifier title",
      "sortType": true
    }
  }'
*/
