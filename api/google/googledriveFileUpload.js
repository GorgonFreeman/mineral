const fs = require('fs').promises;
const path = require('path');
const { Readable } = require('stream');

const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleDrive, googleApiCall } = require('../google/google.utils');

const fileDataValidator = (fileData) => {
  if (fileData?.filePath) {
    return true;
  }

  return Boolean(fileData?.fileName && fileData?.fileSource !== undefined);
};

const folderIdentifierValidator = (folderIdentifier) => {
  return objHasAny(folderIdentifier, ['folderId']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fileData', fileDataValidator],
  ['folderIdentifier', folderIdentifierValidator],
]);

const googledriveFileUpload = async (
  credsPayload,
  fileData,
  folderIdentifier,
  {
    mimeType = 'application/octet-stream',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fileData,
    folderIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  let {
    filePath,
    fileName,
    fileSource,
  } = fileData;

  const { folderId } = folderIdentifier;

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

  const buffer = Buffer.isBuffer(fileSource)
    ? fileSource
    : Buffer.from(String(fileSource));

  const { client, error } = await getGoogleDrive(credsPayload);

  if (error) {
    return error;
  }

  const uploadResponse = await googleApiCall(() => client.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: fileName,
      ...folderId && { parents: [folderId] },
    },
    media: {
      body: Readable.from(buffer),
      mimeType,
    },
  }));

  if (!uploadResponse.ok) {
    return uploadResponse;
  }

  const uploadedFileId = uploadResponse.data.id;
  const fileUrl = `https://drive.google.com/file/d/${ uploadedFileId }/view`;
  const folderUrl = folderId ? `https://drive.google.com/drive/folders/${ folderId }` : null;

  return {
    ok: true,
    data: {
      ...uploadResponse.data,
      customData: {
        fileUrl,
        ...folderUrl && { folderUrl },
      },
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googledriveFileUpload,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googledriveFileUpload" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "fileData": { "fileName": "hello.txt", "fileSource": "hello world" },
    "folderIdentifier": { "folderId": "REPLACE_FOLDER_ID" }
  }'
*/
