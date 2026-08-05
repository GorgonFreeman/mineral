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

const linearUsersGetPacket = async (
  credsPayload,
  {
    filter,
    includeDisabled,
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
          query UsersGet(
            $filter: UserFilter
            $includeDisabled: Boolean
            $before: String
            $after: String
            $first: Int
            $last: Int
            $includeArchived: Boolean
            $orderBy: PaginationOrderBy
            $sort: [UserSortInput!]
          ) {
            users(
              filter: $filter
              includeDisabled: $includeDisabled
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
                displayName
                email
                active
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
          includeDisabled,
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
      resultPath: 'data.users',
    },
    inspect,
  });
};

const linearUsersGet = async (
  returnGetter,

  credsPayload,
  {
    filter,
    includeDisabled,
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
        includeDisabled,
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
      func: linearUsersGetPacket,
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
  linearUsersGet: (...args) => linearUsersGet(false, ...args),
  linearUsersGetter: (...args) => linearUsersGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearUsersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 10
    }
  }'
*/
