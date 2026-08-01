// https://discord.com/developers/docs/resources/user#get-current-user

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { discordClient } = require('../discord/discord.utils');
const { MAX_PER_PAGE } = require('../discord/discord.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const discordGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
  } = {},
) => {
  const {
    limit = Math.min(perPage, MAX_PER_PAGE),
    ...restParams
  } = params ?? {};

  return discordClient.fetch({
    requestPayload: {
      url,
      params: {
        limit,
        ...restParams,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const discordGetPaginator = async (currentParams, response) => {
  const { args, options } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  const items = Array.isArray(response.data) ? response.data : [];
  const { perPage = MAX_PER_PAGE, params = {} } = options;
  const { limit = Math.min(perPage, MAX_PER_PAGE) } = params;

  if (items.length < limit) {
    return [true];
  }

  const lastItem = items[items.length - 1];
  const before = lastItem?.id;
  if (!before) {
    return [true];
  }

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...params,
        before,
      },
    },
  }];
};

const discordGet = async (
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
      func: discordGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return Array.isArray(response.data) ? response.data : [];
      },
      paginator: discordGetPaginator,
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
  discordGet: (...args) => discordGet(false, ...args),
  discordGetter: (...args) => discordGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/discordGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "discord" },
    "url": "/users/@me"
  }'
*/
