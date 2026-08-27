// https://www.dropbox.com/developers/documentation/http/documentation#files-move_v2

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxClient } = require('../dropbox/dropbox.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fromPath'],
  ['toPath'],
]);

const dropboxFileMove = async (
  credsPayload,
  fromPath,
  toPath,
  {
    allowSharedFolder = false,
    autorename = false,
    allowOwnershipTransfer = false,
    fetchClient = dropboxClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fromPath,
    toPath,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: '/files/move_v2',
      body: {
        from_path: fromPath,
        to_path: toPath,
        allow_shared_folder: allowSharedFolder,
        autorename,
        allow_ownership_transfer: allowOwnershipTransfer,
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
  dropboxFileMove,
  funcApiConfig,
};
