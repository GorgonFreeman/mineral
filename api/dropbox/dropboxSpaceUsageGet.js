// https://www.dropbox.com/developers/documentation/http/documentation#users-get_space_usage

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxClient } = require('../dropbox/dropbox.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const dropboxSpaceUsageGet = async (
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
      url: '/users/get_space_usage',
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
  dropboxSpaceUsageGet,
  funcApiConfig,
};
