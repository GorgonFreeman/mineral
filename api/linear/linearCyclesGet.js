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

const linearCyclesGetPacket = async (
  credsPayload,
  {
    filter,
    before,
    after,
    last,
    includeArchived,
    orderBy,
    perPage = MAX_PER_PAGE,
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {
  return fetchClient.fetch({
    requestPayload: {
      body: {
        query: `
          query CyclesGet(
            $filter: CycleFilter
            $before: String
            $after: String
            $first: Int
            $last: Int
            $includeArchived: Boolean
            $orderBy: PaginationOrderBy
          ) {
            cycles(
              filter: $filter
              before: $before
              after: $after
              first: $first
              last: $last
              includeArchived: $includeArchived
              orderBy: $orderBy
            ) {
              nodes {
                id
                name
                number
                startsAt
                endsAt
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
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.cycles',
    },
    inspect,
  });
};

const linearCyclesGet = async (
  returnGetter,

  credsPayload,
  {
    filter,
    before,
    after,
    last,
    includeArchived,
    orderBy,
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
        perPage,
        inspect,
        fetchClient,
      },
    },
    {
      func: linearCyclesGetPacket,
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
  linearCyclesGet: (...args) => linearCyclesGet(false, ...args),
  linearCyclesGetter: (...args) => linearCyclesGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearCyclesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 5
    }
  }'
*/
