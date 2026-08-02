// https://www.backblaze.com/apidocs/b2-list-file-names

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { B2_API_VERSION_PATH, MAX_FILES_PER_PAGE } = require('../backblaze/backblaze.constants');
const { backblazeClient } = require('../backblaze/backblaze.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const backblazeGetPacket = async (
  credsPayload,
  url,
  {
    params,
    maxFileCount = MAX_FILES_PER_PAGE,
    fetchClient = backblazeClient,
  } = {},
) => {

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url,
      params: {
        maxFileCount,
        ...params,
      },
    },
    context: { credsPayload },
  });
};

const backblazeGetPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const { nextFileName } = response.data ?? {};

  if (!nextFileName) {
    return [true];
  }

  const { args, options } = currentParams;

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...options.params,
        startFileName: nextFileName,
      },
    },
  }];
};

const backblazeGetDigester = (response) => {
  if (!response?.ok) {
    return [];
  }

  return response.data?.files ?? [];
};

const backblazeGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    maxFileCount = MAX_FILES_PER_PAGE,
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
        maxFileCount,
        fetchClient,
      },
    },
    {
      func: backblazeGetPacket,
      digester: backblazeGetDigester,
      paginator: backblazeGetPaginator,
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
  backblazeGet: (...args) => backblazeGet(false, ...args),
  backblazeGetter: (...args) => backblazeGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/backblazeGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "backblaze" },
    "url": "/b2api/v2/b2_list_file_names",
    "options": {
      "params": { "bucketId": "REPLACE_BUCKET_ID" }
    }
  }'
*/
