// https://www.dropbox.com/developers/documentation/http/documentation#files-create_folder_v2

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxClient } = require('../dropbox/dropbox.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['path'],
]);

const dropboxFolderCreate = async (
  credsPayload,
  path,
  {
    autorename = false,
    fetchClient = dropboxClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    path,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: '/files/create_folder_v2',
      body: {
        path,
        autorename,
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

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  dropboxFolderCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/dropboxFolderCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "dropbox" },
    "path": "/Homework/math"
  }'
*/
