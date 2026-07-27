// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-tag-v1_-_Search_>_Advanced

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const threeclicksGetPacket = async (
  credsPayload,
  url,
  {
    params,
    page = '1',
  } = {},
) => {
  const paramsWithPage = {
    ...params,
    page: String(page),
  };

  return threeclicksClient.fetch({
    requestPayload: {
      url,
      method: 'get',
      params: paramsWithPage,
    },
    context: {
      credsPayload,
    },
  });
};

const threeclicksGetPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const pageCount = response?.data?.content?.pagination_data?.page_count;
  const currentPage = parseInt(currentParams.options.page, 10);

  if (!pageCount || currentPage >= pageCount) {
    return [true];
  }

  const { args, options } = currentParams;

  return [false, {
    args,
    options: {
      ...options,
      page: String(currentPage + 1),
    },
  }];
};

const threeclicksGetDigester = (response) => {
  if (!response?.ok) {
    return [];
  }

  return response?.data?.content?.pagination_data?.result_data ?? [];
};

const threeclicksGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    page = '1',
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
        page,
      },
    },
    {
      func: threeclicksGetPacket,
      digester: threeclicksGetDigester,
      paginator: threeclicksGetPaginator,
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
  threeclicksGet: (...args) => threeclicksGet(false, ...args),
  threeclicksGetter: (...args) => threeclicksGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/threeclicksGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "threeclicks" },
    "url": "/search/advanced/style",
    "options": {
      "params": {
        "mode": "all"
      }
    }
  }'
*/
