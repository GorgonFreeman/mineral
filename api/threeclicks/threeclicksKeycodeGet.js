// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['styleNumber'],
  ['styleColoursizeId'],
  ['size'],
]);

const threeclicksKeycodeGet = async (credsPayload, styleNumber, styleColoursizeId, size) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    styleNumber,
    styleColoursizeId,
    size,
  });
  if (rejectResponse) return rejectResponse;

  const params = {
    size,
    style_coloursize_id: styleColoursizeId,
  };

  return threeclicksClient.fetch({
    requestPayload: {
      url: `/style/codes/keycode/${ styleNumber }`,
      method: 'get',
      params,
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksKeycodeGet, funcApiConfig: { argsWarden } };
