// https://www.figma.com/developers/api#get-me-endpoint

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { figmaClient } = require('../figma/figma.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const figmaGetPacket = async (
  credsPayload,
  url,
  {
    params,
  } = {},
) => {
  return figmaClient.fetch({
    requestPayload: {
      url,
      params,
    },
    context: {
      credsPayload,
    },
  });
};

const figmaGetPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  return [true];
};

const figmaGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
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
      },
    },
    {
      func: figmaGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return Array.isArray(response.data) ? response.data : [];
      },
      paginator: figmaGetPaginator,
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
  figmaGet: (...args) => figmaGet(false, ...args),
  figmaGetter: (...args) => figmaGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/figmaGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "figma" },
    "url": "/me"
  }'
*/
