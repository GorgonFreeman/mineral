// https://www.dropbox.com/developers/documentation/http/documentation#files-get_temporary_link

const { ArgsWarden, actionSingleOrMultiple, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxClient } = require('../dropbox/dropbox.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['path'],
]);

const dropboxTemporaryLinkGetSingle = async (
  credsPayload,
  path,
  {
    fetchClient = dropboxClient,
  } = {},
) => {
  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: '/files/get_temporary_link',
      body: { path },
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return {
    ok: true,
    data,
  };
};

const dropboxTemporaryLinkGet = async (
  credsPayload,
  path,
  {
    queueRunOptions,
    fetchClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    path,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    path,
    dropboxTemporaryLinkGetSingle,
    (pathItem) => ({
      args: [credsPayload, pathItem, { fetchClient }],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  dropboxTemporaryLinkGet,
  funcApiConfig,
};
