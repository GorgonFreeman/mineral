// https://developers.cloudflare.com/api/

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { cloudflareClient } = require('../cloudflare/cloudflare.utils');
const { MAX_PER_PAGE } = require('../cloudflare/cloudflare.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const cloudflareGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    inspect = false,
    fetchClient = cloudflareClient,
  } = {},
) => {
  const {
    page = 1,
    ...restParams
  } = params ?? {};

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url,
      params: {
        per_page: Math.min(perPage, MAX_PER_PAGE),
        page,
        ...restParams,
      },
    },
    context: {
      credsPayload,
      resultPath: 'result',
    },
    inspect,
  });
};

const cloudflareGetDigester = (response) => {
  if (!response?.ok) {
    return [];
  }

  return Array.isArray(response.data) ? response.data : [];
};

const cloudflareGetPaginator = async (currentParams, response) => {
  const { args, options } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  const resultInfo = response.meta?.resultInfo;
  if (!resultInfo) {
    return [true];
  }

  const {
    page = 1,
    total_pages: totalPages,
  } = resultInfo;

  if (!totalPages || page >= totalPages) {
    return [true];
  }

  const { params = {} } = options;

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...params,
        page: page + 1,
      },
    },
  }];
};

const cloudflareGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    inspect = false,
    fetchClient = cloudflareClient,
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
        inspect,
        fetchClient,
      },
    },
    {
      func: cloudflareGetPacket,
      digester: cloudflareGetDigester,
      paginator: cloudflareGetPaginator,
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
  cloudflareGet: cloudflareGet.bind(null, false),
  cloudflareGetter: cloudflareGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" },
    "url": "/zones",
    "options": {
      "limit": 5
    }
  }'
*/
