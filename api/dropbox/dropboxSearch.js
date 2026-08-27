// https://www.dropbox.com/developers/documentation/http/documentation#files-search_v2

const { ArgsWarden, Getter, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxClient } = require('../dropbox/dropbox.utils');
const { MAX_PER_PAGE } = require('../dropbox/dropbox.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
]);

const dropboxSearchPacket = async (
  credsPayload,
  query,
  {
    body = {},
    perPage = 100,
    fetchClient = dropboxClient,
  } = {},
) => {
  if (body.cursor) {
    return fetchClient.fetch({
      context: { credsPayload },
      requestPayload: {
        method: 'post',
        url: '/files/search/continue_v2',
        body: { cursor: body.cursor },
      },
    });
  }

  return fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: '/files/search_v2',
      body: {
        query,
        options: {
          max_results: Math.min(perPage, MAX_PER_PAGE),
          ...(body.options || {}),
        },
        ...(body.match_field_options && {
          match_field_options: body.match_field_options,
        }),
      },
    },
  });
};

const dropboxSearchPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const { has_more: hasMore, cursor } = response.data ?? {};
  if (!hasMore || !cursor) {
    return [true];
  }

  const { args, options } = currentParams;

  return [false, {
    args,
    options: {
      ...options,
      body: {
        cursor,
      },
    },
  }];
};

const dropboxSearch = async (
  returnGetter,

  credsPayload,
  query,
  {
    path,
    fileStatus,
    filenameOnly,
    maxResults,
    fileCategories,
    accountId,
    perPage = 100,
    fetchClient,
    ...getterOptions
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const options = {
    ...(path !== undefined && { path }),
    ...(fileStatus !== undefined && { file_status: fileStatus }),
    ...(filenameOnly !== undefined && { filename_only: filenameOnly }),
    ...(maxResults !== undefined && { max_results: maxResults }),
    ...(fileCategories !== undefined && { file_categories: fileCategories }),
    ...(accountId !== undefined && { account_id: accountId }),
  };

  const getter = new Getter(
    {
      args: [credsPayload, query],
      options: {
        body: { options },
        perPage: maxResults ?? perPage,
        fetchClient,
      },
    },
    {
      func: dropboxSearchPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }
        return response.data?.matches ?? [];
      },
      paginator: dropboxSearchPaginator,
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
  dropboxSearch: (...args) => dropboxSearch(false, ...args),
  dropboxSearchGetter: (...args) => dropboxSearch(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/dropboxSearch" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "dropbox" },
    "query": "prime",
    "options": { "path": "/Homework" }
  }'
*/
