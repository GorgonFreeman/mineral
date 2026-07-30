// https://developers.printify.com/#upload-a-new-image

const { ArgsWarden, actionSingleOrMultiple, everyIfArray, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const uploadPayloadValidator = (uploadPayload) => {
  return valueProvided(uploadPayload?.imageUrl)
    && valueProvided(uploadPayload?.filename);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['uploadPayload', (uploadPayload) => everyIfArray(uploadPayloadValidator, uploadPayload)],
]);

const printifyImageUploadSingle = async (
  credsPayload,
  uploadPayload,
) => {
  const {
    imageUrl,
    filename,
  } = uploadPayload;

  return printifyClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/uploads/images.json',
      body: {
        url: imageUrl,
        file_name: filename,
      },
    },
    context: { credsPayload },
  });
};

const printifyImageUpload = async (
  credsPayload,
  uploadPayload,
  {
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    uploadPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    uploadPayload,
    printifyImageUploadSingle,
    (uploadPayloadItem) => ({
      args: [credsPayload, uploadPayloadItem],
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
  printifyImageUpload,
  funcApiConfig,
};
