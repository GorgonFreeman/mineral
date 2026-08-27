// https://www.dropbox.com/developers/documentation/http/documentation#users-get_current_account

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxClient } = require('../dropbox/dropbox.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const dropboxAccountGet = async (
  credsPayload,
  {
    fetchClient = dropboxClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: '/users/get_current_account',
      // Dropbox expects the literal JSON null for no-arg endpoints.
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'null',
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
  dropboxAccountGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/dropboxAccountGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "dropbox" }
  }'
*/
