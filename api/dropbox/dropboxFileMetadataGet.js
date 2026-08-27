// https://www.dropbox.com/developers/documentation/http/documentation#files-get_metadata

const { ArgsWarden, actionSingleOrMultiple, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxClient } = require('../dropbox/dropbox.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['path'],
]);

const dropboxFileMetadataGetSingle = async (
  credsPayload,
  path,
  {
    includeMediaInfo = false,
    includeDeleted = false,
    includeHasExplicitSharedMembers = false,
    fetchClient = dropboxClient,
  } = {},
) => {
  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: '/files/get_metadata',
      body: {
        path,
        include_media_info: includeMediaInfo,
        include_deleted: includeDeleted,
        include_has_explicit_shared_members: includeHasExplicitSharedMembers,
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
    data,
  };
};

const dropboxFileMetadataGet = async (
  credsPayload,
  path,
  {
    includeMediaInfo,
    includeDeleted,
    includeHasExplicitSharedMembers,
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
    dropboxFileMetadataGetSingle,
    (pathItem) => ({
      args: [credsPayload, pathItem, {
        includeMediaInfo,
        includeDeleted,
        includeHasExplicitSharedMembers,
        fetchClient,
      }],
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
  dropboxFileMetadataGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/dropboxFileMetadataGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "dropbox" },
    "path": "/Homework/math/Prime_Numbers.txt"
  }'
*/
