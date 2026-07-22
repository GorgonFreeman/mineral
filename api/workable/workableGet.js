// https://workable.readme.io/reference/jobs

const { credsFromPayload, ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { workableClient } = require('../workable/workable.utils');
const { MAX_PER_PAGE } = require('../workable/workable.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const digResults = (data, resultsKey) => {
  if (resultsKey) {
    return data?.[resultsKey] ?? [];
  }

  const arrayEntry = Object.entries(data || {}).find(([, value]) => Array.isArray(value));
  return arrayEntry ? arrayEntry[1] : [];
};

const workableGetPacket = async (
  creds,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
  } = {},
) => {
  return workableClient.fetch({
    url,
    params: {
      limit: Math.min(perPage, MAX_PER_PAGE),
      ...params,
    },
    context: {
      creds,
    },
  });
};

const workableGetPaginator = async (currentParams, response) => {
  const { args, options } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  const nextUrl = response?.data?.paging?.next;
  if (!nextUrl) {
    return [true];
  }

  const nextParams = Object.fromEntries(new URL(nextUrl).searchParams.entries());

  return [false, {
    args,
    options: {
      ...options,
      params: nextParams,
    },
  }];
};

const workableGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    resultsKey,
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

  const creds = await credsFromPayload(credsPayload);

  const getter = new Getter(
    {
      args: [creds, url],
      options: {
        params,
        perPage,
      },
    },
    {
      func: workableGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return digResults(response.data, resultsKey);
      },
      paginator: workableGetPaginator,
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
  workableGet: (...args) => workableGet(false, ...args),
  workableGetter: (...args) => workableGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/workableGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "workable" },
    "url": "/jobs"
  }'

curl -X POST "http://localhost:8000/workableGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "workable" },
    "url": "/jobs",
    "options": {
      "params": { "state": "published" },
      "resultsKey": "jobs",
      "limit": 10
    }
  }'
*/
