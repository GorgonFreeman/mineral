// https://linear.app/developers/graphql

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { MAX_PER_PAGE } = require('../linear/linear.constants');
const {
  linearClient,
  linearConnectionDigester,
  linearConnectionPaginator,
} = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearProjectsGetPacket = async (
  credsPayload,
  {
    filter,
    before,
    after,
    last,
    includeArchived,
    orderBy,
    sort,
    perPage = MAX_PER_PAGE,
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {
  return fetchClient.fetch({
    requestPayload: {
      body: {
        query: `
          query ProjectsGet(
            $filter: ProjectFilter
            $before: String
            $after: String
            $first: Int
            $last: Int
            $includeArchived: Boolean
            $orderBy: PaginationOrderBy
            $sort: [ProjectSortInput!]
          ) {
            projects(
              filter: $filter
              before: $before
              after: $after
              first: $first
              last: $last
              includeArchived: $includeArchived
              orderBy: $orderBy
              sort: $sort
            ) {
              nodes {
                id
                name
                description
                url
                state
                createdAt
                updatedAt
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
          filter,
          before,
          after,
          first: Math.min(perPage, MAX_PER_PAGE),
          last,
          includeArchived,
          orderBy,
          sort,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.projects',
    },
    inspect,
  });
};

const linearProjectsGet = async (
  returnGetter,

  credsPayload,
  {
    filter,
    before,
    after,
    last,
    includeArchived,
    orderBy,
    sort,
    perPage = MAX_PER_PAGE,
    inspect = false,
    fetchClient = linearClient,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getter = new Getter(
    {
      args: [credsPayload],
      options: {
        filter,
        before,
        after,
        last,
        includeArchived,
        orderBy,
        sort,
        perPage,
        inspect,
        fetchClient,
      },
    },
    {
      func: linearProjectsGetPacket,
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
  linearProjectsGet: (...args) => linearProjectsGet(false, ...args),
  linearProjectsGetter: (...args) => linearProjectsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearProjectsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 10
    }
  }'
*/
