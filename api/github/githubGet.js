// https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');
const { MAX_PER_PAGE } = require('../github/github.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const githubGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
  } = {},
) => {
  const {
    page = 1,
    ...restParams
  } = params ?? {};

  return githubClient.fetch({
    requestPayload: {
      url,
      params: {
        per_page: Math.min(perPage, MAX_PER_PAGE),
        page,
        ...restParams,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const githubGetPaginator = async (currentParams, response) => {
  const { args, options } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  const items = Array.isArray(response.data) ? response.data : [];
  const { perPage = MAX_PER_PAGE, params = {} } = options;

  if (items.length < Math.min(perPage, MAX_PER_PAGE)) {
    return [true];
  }

  const { page = 1, ...restParams } = params;

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...restParams,
        page: page + 1,
      },
    },
  }];
};

const githubGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
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
      },
    },
    {
      func: githubGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return Array.isArray(response.data) ? response.data : [];
      },
      paginator: githubGetPaginator,
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
  githubGet: (...args) => githubGet(false, ...args),
  githubGetter: (...args) => githubGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "url": "/user/repos",
    "options": {
      "params": { "sort": "updated" },
      "limit": 10
    }
  }'
*/
