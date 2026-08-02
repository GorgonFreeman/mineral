// https://www.backblaze.com/apidocs/b2-upload-file

const fs = require('fs').promises;
const path = require('path');

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const {
  backblazeUploadFileBytes,
  getBackblazeSession,
  publicFileUrlForBucketName,
} = require('../backblaze/backblaze.utils');

const fileDataValidator = (fileData) => {
  const { filePath, fileName, fileSource } = fileData;
  return valueProvided(filePath) 
    || (valueProvided(fileName) && valueProvided(fileSource))
    ;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['bucketId'],
  ['fileData', fileDataValidator],
]);

const backblazeFileUpload = async (
  credsPayload,
  bucketId,
  fileData,
  {
    bucketName,
    contentType = 'b2/x-auto',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    bucketId,
    fileData,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  let {
    filePath,
    fileName,
    fileSource,
  } = fileData;

  if (filePath) {
    fileName = path.basename(filePath);
    fileSource = await fs.readFile(filePath);
  }

  if (!(fileName && fileSource !== undefined)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_FILE_DATA',
        message: 'Provide filePath or fileName with fileSource',
      },
    };
  }

  const fileBytes = Buffer.isBuffer(fileSource)
    ? fileSource
    : Buffer.from(String(fileSource));

  const uploadResponse = await backblazeUploadFileBytes({
    credsPayload,
    bucketId,
    fileName,
    fileBytes,
    contentType,
  });

  if (!uploadResponse.ok) {
    return uploadResponse;
  }

  let publicFileUrl;

  if (bucketName) {
    const sessionResponse = await getBackblazeSession(credsPayload);

    if (sessionResponse.ok) {
      publicFileUrl = publicFileUrlForBucketName({
        downloadUrl: sessionResponse.data.downloadUrl,
        bucketName,
        fileName: uploadResponse.data?.fileName ?? fileName,
      });
    }
  }

  return {
    ok: true,
    data: {
      ...uploadResponse.data,
      ...publicFileUrl && {
        customData: {
          publicFileUrl,
        },
      },
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  backblazeFileUpload,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/backblazeFileUpload" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "backblaze" },
    "bucketId": "REPLACE_BUCKET_ID",
    "fileData": { "fileName": "hello.txt", "fileSource": "hello world" },
    "options": { "bucketName": "my-public-bucket" }
  }'
*/
