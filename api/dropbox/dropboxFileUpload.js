// https://www.dropbox.com/developers/documentation/http/documentation#files-upload
// Max 150 MB for a single /files/upload call. Larger files need upload sessions.

const fs = require('fs').promises;
const pathModule = require('path');

const { ArgsWarden, valueProvided, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { dropboxContentClient } = require('../dropbox/dropbox.utils');

const fileDataValidator = (fileData) => {
  if (!fileData || typeof fileData !== 'object') {
    return false;
  }
  const { filePath, fileSource, contents } = fileData;
  return valueProvided(filePath)
    || valueProvided(fileSource)
    || valueProvided(contents);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['path'],
  ['fileData', fileDataValidator],
]);

const dropboxFileUpload = async (
  credsPayload,
  path,
  fileData,
  {
    mode = 'add', // 'add' | 'overwrite' | { '.tag': 'update', update: rev }
    autorename = false,
    mute = false,
    strictConflict = false,
    clientModified,
    fetchClient = dropboxContentClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    path,
    fileData,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  let body;
  if (valueProvided(fileData.filePath)) {
    body = await fs.readFile(fileData.filePath);
  } else if (valueProvided(fileData.fileSource)) {
    body = Buffer.isBuffer(fileData.fileSource)
      ? fileData.fileSource
      : Buffer.from(fileData.fileSource, fileData.encoding || 'utf8');
  } else if (valueProvided(fileData.contents)) {
    body = Buffer.isBuffer(fileData.contents)
      ? fileData.contents
      : Buffer.from(fileData.contents, fileData.encoding || 'utf8');
  }

  if (!body) {
    return {
      ok: false,
      error: {
        code: 'INVALID_FILE_DATA',
        message: 'Provide filePath, fileSource, or contents',
      },
    };
  }

  // If path ends with / or is empty folder style, append basename from filePath.
  let uploadPath = path;
  if (fileData.filePath && (path.endsWith('/') || path === '')) {
    uploadPath = `${ path.replace(/\/$/, '') }/${ pathModule.basename(fileData.filePath) }`;
  }

  const arg = {
    path: uploadPath,
    mode,
    autorename,
    mute,
    strict_conflict: strictConflict,
    ...(clientModified !== undefined && { client_modified: clientModified }),
  };

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: '/files/upload',
      headers: {
        'Dropbox-API-Arg': JSON.stringify(arg),
        'Content-Type': 'application/octet-stream',
      },
      body,
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
  dropboxFileUpload,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/dropboxFileUpload" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "dropbox" },
    "path": "/Homework/math/hello.txt",
    "fileData": { "contents": "hello world" }
  }'
*/
