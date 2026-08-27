// https://www.dropbox.com/developers/documentation/http/documentation#files-delete_v2

const { ArgsWarden, actionSingleOrMultiple, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxClient } = require('../dropbox/dropbox.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['path'],
]);

const dropboxFileDeleteSingle = async (
  credsPayload,
  path,
  {
    parentRev,
    fetchClient = dropboxClient,
  } = {},
) => {
  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: '/files/delete_v2',
      body: {
        path,
        ...(parentRev !== undefined && { parent_rev: parentRev }),
      },
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return {
    ok: true,
    data: data.metadata ?? data,
  };
};

const dropboxFileDelete = async (
  credsPayload,
  path,
  {
    parentRev,
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
    dropboxFileDeleteSingle,
    (pathItem) => ({
      args: [credsPayload, pathItem, { parentRev, fetchClient }],
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
  dropboxFileDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/dropboxFileDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "dropbox" },
    "path": "/Homework/math/Prime_Numbers.txt"
  }'
*/
