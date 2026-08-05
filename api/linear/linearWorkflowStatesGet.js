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

const linearWorkflowStatesGetPacket = async (
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
          query WorkflowStatesGet(
            $filter: WorkflowStateFilter
            $before: String
            $after: String
            $first: Int
            $last: Int
            $includeArchived: Boolean
            $orderBy: PaginationOrderBy
          ) {
            workflowStates(
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
                type
                position
                team {
                  id
                  name
                }
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
      resultPath: 'data.workflowStates',
    },
    inspect,
  });
};

const linearWorkflowStatesGet = async (
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
      func: linearWorkflowStatesGetPacket,
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
  linearWorkflowStatesGet: (...args) => linearWorkflowStatesGet(false, ...args),
  linearWorkflowStatesGetter: (...args) => linearWorkflowStatesGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearWorkflowStatesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 20,
      "filter": {
        "team": { "id": { "eq": "f2387dcd-61ac-49aa-8d7a-7f62a0b5cca0" } }
      }
    }
  }'
*/
