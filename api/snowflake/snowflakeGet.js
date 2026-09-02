// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api
// REST list endpoints paginate with showLimit + fromName (last item name).

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { snowflakeClient } = require('../snowflake/snowflake.utils');
const {
  DEFAULT_SHOW_LIMIT,
  MAX_SHOW_LIMIT,
} = require('../snowflake/snowflake.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const digResults = (data) => {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  if (Array.isArray(data?.result)) {
    return data.result;
  }
  return [];
};

const snowflakeGetPacket = async (
  credsPayload,
  url,
  {
    params,
    showLimit = DEFAULT_SHOW_LIMIT,
    fetchClient = snowflakeClient,
  } = {},
) => {
  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url,
      params: {
        showLimit: Math.min(showLimit, MAX_SHOW_LIMIT),
        ...params,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const snowflakeGetPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const { args, options } = currentParams;
  const {
    params = {},
    showLimit = DEFAULT_SHOW_LIMIT,
  } = options;

  const items = digResults(response.data);
  const limit = Number(params.showLimit ?? showLimit);

  if (!items.length || items.length < limit) {
    return [true];
  }

  const last = items[items.length - 1];
  const lastName = last?.name;
  if (!lastName) {
    return [true];
  }

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...params,
        showLimit: limit,
        fromName: lastName,
      },
    },
  }];
};

const snowflakeGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    showLimit = DEFAULT_SHOW_LIMIT,
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
        showLimit,
        fetchClient,
      },
    },
    {
      func: snowflakeGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }
        return digResults(response.data);
      },
      paginator: snowflakeGetPaginator,
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
  snowflakeGet: (...args) => snowflakeGet(false, ...args),
  snowflakeGetter: (...args) => snowflakeGet(true, ...args),
  funcApiConfig,
};
