// https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_concepts_paging.htm

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { tableauClient } = require('../tableau/tableau.utils');
const { MAX_PER_PAGE } = require('../tableau/tableau.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

// Tableau list responses nest items, e.g. data.users.user, data.workbooks.workbook.
// resultsKey may be a dotted path such as "users.user".
const digResults = (data, resultsKey) => {
  if (resultsKey) {
    const value = resultsKey.split('.').reduce(
      (node, key) => node?.[key],
      data,
    );
    if (Array.isArray(value)) {
      return value;
    }
    return value != null ? [value] : [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  const arrayEntry = Object.entries(data || {}).find(([, value]) => Array.isArray(value));
  return arrayEntry ? arrayEntry[1] : [];
};

const tableauGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    fetchClient = tableauClient,
  } = {},
) => {
  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url,
      params: {
        pageSize: Math.min(perPage, MAX_PER_PAGE),
        pageNumber: 1,
        ...params,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const tableauGetPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const pagination = response?.data?.pagination;
  if (!pagination) {
    return [true];
  }

  const pageNumber = Number(pagination.pageNumber);
  const pageSize = Number(pagination.pageSize);
  const totalAvailable = Number(pagination.totalAvailable);

  if (!pageNumber || !pageSize || Number.isNaN(totalAvailable)) {
    return [true];
  }

  if (pageNumber * pageSize >= totalAvailable) {
    return [true];
  }

  const { args, options } = currentParams;

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...options.params,
        pageNumber: pageNumber + 1,
      },
    },
  }];
};

const tableauGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    resultsKey,
    fetchClient,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    url,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getter = new Getter(
    {
      args: [credsPayload, url],
      options: {
        params,
        perPage,
        fetchClient,
      },
    },
    {
      func: tableauGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return digResults(response.data, resultsKey);
      },
      paginator: tableauGetPaginator,
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
  tableauGet: (...args) => tableauGet(false, ...args),
  tableauGetter: (...args) => tableauGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/tableauGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "tableau" },
    "url": "/sites/{siteId}/users",
    "options": {
      "resultsKey": "users.user",
      "perPage": 100
    }
  }'
*/
