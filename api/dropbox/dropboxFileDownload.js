// https://www.dropbox.com/developers/documentation/http/documentation#files-download
// Returns file metadata plus contents as base64 (JSON-safe).

const { ArgsWarden, actionSingleOrMultiple, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { customFetch, appendUrlToBase, credsFromPayload } = require('../utils');
const { DROPBOX_CONTENT_BASE_URL } = require('../dropbox/dropbox.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['path'],
]);

const dropboxFileDownloadSingle = async (
  credsPayload,
  path,
  {
    rev,
    // When true, return raw ArrayBuffer in data.contentsBuffer instead of base64
    // (not useful over funcApi JSON; kept for in-process callers).
    asBuffer = false,
  } = {},
) => {
  const creds = await credsFromPayload(credsPayload);
  const { ACCESS_TOKEN } = creds ?? {};

  if (!ACCESS_TOKEN) {
    return {
      ok: false,
      error: {
        code: 'MISSING_DROPBOX_CREDS',
        message: 'dropbox creds require ACCESS_TOKEN',
      },
    };
  }

  const arg = {
    path,
    ...(rev !== undefined && { rev }),
  };

  const url = appendUrlToBase(DROPBOX_CONTENT_BASE_URL, '/files/download');

  // customFetch so we can read Dropbox-API-Result header + binary body.
  const response = await customFetch(url, {
    method: 'post',
    headers: {
      Authorization: `Bearer ${ ACCESS_TOKEN }`,
      'Dropbox-API-Arg': JSON.stringify(arg),
    },
    // Empty body; Dropbox still expects POST.
    body: '',
    responseParser: async (res) => {
      const resultHeader = res.headers.get('dropbox-api-result');
      let metadata = null;
      if (resultHeader) {
        try {
          metadata = JSON.parse(resultHeader);
        } catch {
          metadata = { raw: resultHeader };
        }
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      return {
        metadata,
        buffer,
      };
    },
  });

  if (!response.ok) {
    logDeep({ error: response.error ?? response.data });
    return {
      ok: false,
      error: response.error ?? response.data,
    };
  }

  const { metadata, buffer } = response.data;

  return {
    ok: true,
    data: {
      ...(metadata || {}),
      ...(asBuffer
        ? { contentsBuffer: buffer }
        : { contentsBase64: buffer.toString('base64') }),
      size: buffer.length,
    },
  };
};

const dropboxFileDownload = async (
  credsPayload,
  path,
  {
    rev,
    asBuffer,
    queueRunOptions,
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
    dropboxFileDownloadSingle,
    (pathItem) => ({
      args: [credsPayload, pathItem, { rev, asBuffer }],
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
  dropboxFileDownload,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/dropboxFileDownload" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "dropbox" },
    "path": "/Homework/math/Prime_Numbers.txt"
  }'
*/
