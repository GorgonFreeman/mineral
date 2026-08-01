// https://apidoc.pipe17.com/

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17Client } = require('../pipe17/pipe17.utils');
const { DEFAULT_PAGE_SIZE } = require('../pipe17/pipe17.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
  ['itemsKey'],
]);

const pipe17GetPacket = async (
  credsPayload,
  url,
  itemsKey,
  {
    params,
    count = DEFAULT_PAGE_SIZE,
  } = {},
) => {
  return pipe17Client.fetch({
    requestPayload: {
      method: 'get',
      url,
      params: {
        count,
        ...params,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const pipe17GetPaginator = async (currentParams, response) => {
  const { args, options } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  const pagination = response.data?.result?.pagination
    ?? response.data?.pagination;
  if (!pagination) {
    return [true];
  }

  const { last, pageSize } = pagination;
  if (last) {
    return [true];
  }

  const { params = {} } = options;
  const skip = (params.skip ?? 0) + (pageSize ?? options.count ?? DEFAULT_PAGE_SIZE);

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...params,
        skip,
      },
    },
  }];
};

const pipe17Get = async (
  returnGetter,

  credsPayload,
  url,
  itemsKey,
  {
    params,
    count = DEFAULT_PAGE_SIZE,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    url,
    itemsKey,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getter = new Getter(
    {
      args: [credsPayload, url, itemsKey],
      options: {
        params,
        count,
      },
    },
    {
      func: pipe17GetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return response.data?.result?.[itemsKey]
          ?? response.data?.[itemsKey]
          ?? [];
      },
      paginator: pipe17GetPaginator,
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
  pipe17Get: (...args) => pipe17Get(false, ...args),
  pipe17Getter: (...args) => pipe17Get(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17Get" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "url": "/locations",
    "itemsKey": "locations",
    "options": {
      "count": 25,
      "limit": 5
    }
  }'
*/
