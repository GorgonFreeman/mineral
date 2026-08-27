// https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxGet } = require('../dropbox/dropboxGet');
const { MAX_PER_PAGE } = require('../dropbox/dropbox.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

// path: "" for root. recursive walks the whole subtree.
const dropboxFolderList = async (
  credsPayload,
  {
    path = '',
    recursive = false,
    includeDeleted = false,
    includeMediaInfo = false,
    includeMountedFolders = true,
    includeNonDownloadableFiles = true,
    perPage = MAX_PER_PAGE,
    fetchClient,
    ...getterOptions
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return dropboxGet(credsPayload, '/files/list_folder', {
    body: {
      path,
      recursive,
      include_deleted: includeDeleted,
      include_media_info: includeMediaInfo,
      include_mounted_folders: includeMountedFolders,
      include_non_downloadable_files: includeNonDownloadableFiles,
    },
    perPage,
    resultsKey: 'entries',
    fetchClient,
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  dropboxFolderList,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/dropboxFolderList" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "dropbox" },
    "options": { "path": "/Homework" }
  }'
*/
