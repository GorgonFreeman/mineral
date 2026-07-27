// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Style_>_Codes-keycodeCreate

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['styleNumber'],
  ['styleColoursizeId'],
  ['size'],
]);

const threeclicksKeycodeCreate = async (
  credsPayload,
  styleNumber,
  styleColoursizeId,
  size,
  {
    keycode = `${ styleNumber }-${ size }`,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    styleNumber,
    styleColoursizeId,
    size,
  });
  if (rejectResponse) return rejectResponse;

  return threeclicksClient.fetch({
    requestPayload: {
      url: '/style/codes/keycode',
      method: 'post',
      body: {
      size,
      style_coloursize_id: styleColoursizeId,
      style_number: styleNumber,
      keycode,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  threeclicksKeycodeCreate,
  funcApiConfig,
};
