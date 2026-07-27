const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { stylearcadeClient } = require('../stylearcade/stylearcade.utils');
const { MAX_PER_PAGE } = require('../stylearcade/stylearcade.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const stylearcadeGetPacket = async (
  credsPayload,
  {
    params,
    perPage = MAX_PER_PAGE,
    url = '/export',
  } = {},
) => {
  return stylearcadeClient.fetch({
    requestPayload: {
      url,
      params: {
        limit: perPage,
        ...params,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const stylearcadeGetPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const { nextCursor } = response.data || {};

  if (!nextCursor) {
    return [true];
  }

  const { args, options } = currentParams;

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...options.params,
        cursor: nextCursor,
      },
    },
  }];
};

const stylearcadeGetDigester = (response, nodeName) => {
  if (!response?.ok) {
    return [];
  }

  return response?.data?.[nodeName] ?? [];
};

const stylearcadeGet = async (
  returnGetter,

  credsPayload,
  {
    params,
    perPage = MAX_PER_PAGE,
    nodeName = 'records',
    url = '/export',
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
        params,
        perPage,
        url,
      },
    },
    {
      func: stylearcadeGetPacket,
      digester: (response) => stylearcadeGetDigester(response, nodeName),
      paginator: stylearcadeGetPaginator,
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
  stylearcadeGet: (...args) => stylearcadeGet(false, ...args),
  stylearcadeGetter: (...args) => stylearcadeGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stylearcadeGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stylearcade" },
    "options": {
      "limit": 10
    }
  }'
*/
