// https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list

const { ArgsWarden, Getter, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleDrive, googleApiCall } = require('../google/google.utils');
const { MAX_PER_PAGE } = require('../google/google.constants');

const folderIdentifierValidator = (folderIdentifier) => {
  return objHasAny(folderIdentifier, ['folderId']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['folderIdentifier', folderIdentifierValidator],
]);

const googledriveFilesPacket = async (
  credsPayload,
  folderIdentifier,
  {
    pageSize = MAX_PER_PAGE,
    pageToken,
  } = {},
) => {
  const { folderId } = folderIdentifier;

  const { client, error } = await getGoogleDrive(credsPayload);

  if (error) {
    return error;
  }

  return googleApiCall(() => client.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: [
      'trashed=false',
      `'${ folderId }' in parents`,
    ].join(' and '),
    pageSize: Math.min(pageSize, MAX_PER_PAGE),
    ...pageToken && { pageToken },
    fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, md5Checksum)',
  }));
};

const googledriveFilesPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const nextPageToken = response.data?.nextPageToken;
  if (!nextPageToken) {
    return [true];
  }

  const { args, options } = currentParams;

  return [false, {
    args,
    options: {
      ...options,
      pageToken: nextPageToken,
    },
  }];
};

const googledriveFilesGet = async (
  returnGetter,

  credsPayload,
  folderIdentifier,
  {
    pageSize = MAX_PER_PAGE,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    folderIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getter = new Getter(
    {
      args: [credsPayload, folderIdentifier],
      options: {
        pageSize,
      },
    },
    {
      func: googledriveFilesPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return response.data?.files ?? [];
      },
      paginator: googledriveFilesPaginator,
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
  googledriveFilesGet: (...args) => googledriveFilesGet(false, ...args),
  googledriveFilesGetter: (...args) => googledriveFilesGet(true, ...args),
  funcApiConfig,
  folderIdentifierValidator,
};

/*
curl -X POST "http://localhost:8000/googledriveFilesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "folderIdentifier": { "folderId": "REPLACE_FOLDER_ID" }
  }'
*/
