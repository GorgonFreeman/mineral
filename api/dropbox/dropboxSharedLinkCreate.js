// https://www.dropbox.com/developers/documentation/http/documentation#sharing-create_shared_link_with_settings

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxClient } = require('../dropbox/dropbox.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['path'],
]);

const dropboxSharedLinkCreate = async (
  credsPayload,
  path,
  {
    settings,
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
      url: '/sharing/create_shared_link_with_settings',
      body: {
        path,
        ...(settings !== undefined && { settings }),
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

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  dropboxSharedLinkCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/dropboxSharedLinkCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "dropbox" },
    "path": "/Homework/math/Prime_Numbers.txt"
  }'
*/
