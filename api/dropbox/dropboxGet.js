// https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxClient } = require('../dropbox/dropbox.utils');
const { MAX_PER_PAGE } = require('../dropbox/dropbox.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const dropboxGetPacket = async (
  credsPayload,
  url,
  {
    body = {},
    perPage = MAX_PER_PAGE,
    fetchClient = dropboxClient,
  } = {},
) => {
  // When continuing, Dropbox wants only { cursor } on list_folder/continue.
  const isContinue = url.includes('/continue') || body.cursor;

  const requestBody = isContinue
    ? { cursor: body.cursor }
    : {
        ...body,
        ...(body.limit === undefined && {
          limit: Math.min(perPage, MAX_PER_PAGE),
        }),
      };

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url,
      body: requestBody,
    },
    context: {
      credsPayload,
    },
  });
};

const dropboxGetPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const { has_more: hasMore, cursor } = response.data ?? {};
  if (!hasMore || !cursor) {
    return [true];
  }

  const { args, options } = currentParams;
  const [, initialUrl] = args;

  // Switch to the matching continue endpoint when still on the initial path.
  let continueUrl = initialUrl;
  if (!continueUrl.includes('/continue')) {
    continueUrl = `${ initialUrl.replace(/\/$/, '') }/continue`;
  }

  return [false, {
    args: [args[0], continueUrl],
    options: {
      ...options,
      body: {
        cursor,
      },
    },
  }];
};

const dropboxGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    body,
    perPage = MAX_PER_PAGE,
    resultsKey = 'entries',
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
        body,
        perPage,
        fetchClient,
      },
    },
    {
      func: dropboxGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        if (resultsKey) {
          return response.data?.[resultsKey] ?? [];
        }

        return response.data ?? [];
      },
      paginator: dropboxGetPaginator,
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
  dropboxGet: (...args) => dropboxGet(false, ...args),
  dropboxGetter: (...args) => dropboxGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/dropboxGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "dropbox" },
    "url": "/files/list_folder",
    "options": {
      "body": { "path": "" },
      "perPage": 100
    }
  }'
*/
