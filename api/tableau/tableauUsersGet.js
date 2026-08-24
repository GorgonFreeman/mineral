// https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#query_users_on_site
// GET /api/{api-version}/sites/{site-id}/users is paginated (default pageSize
// is 100, max 1000), so this walks all pages and returns the full list.

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { tableauGet } = require('../tableau/tableauGet');
const { MAX_PER_PAGE } = require('../tableau/tableau.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

// Optional filter, e.g. { filter: "siteRole:eq:Explorer" } or
// { filter: "name:has:jane" } per Tableau's filter-expression syntax.
const tableauUsersGet = async (
  credsPayload,
  {
    filter,
    perPage = MAX_PER_PAGE,
    fetchClient,
    ...getterOptions
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return tableauGet(credsPayload, '/sites/{siteId}/users', {
    params: {
      ...(filter ? { filter } : {}),
    },
    perPage,
    resultsKey: 'users.user',
    fetchClient,
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  tableauUsersGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/tableauUsersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "tableau" }
  }'

curl -X POST "http://localhost:8000/tableauUsersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "tableau" },
    "options": {
      "filter": "siteRole:eq:Creator"
    }
  }'
*/
