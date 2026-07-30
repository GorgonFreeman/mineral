// https://developers.printify.com/#upload-a-new-image

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['imageUrl'],
  ['filename'],
]);

const printifyImageUpload = async (
  credsPayload,
  imageUrl,
  filename,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    imageUrl,
    filename,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

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

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyImageUpload,
  funcApiConfig,
};
