// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['styleNumber'],
  ['styleColoursizeId'],
]);

const threeclicksStyleColourDelete = async (credsPayload, styleNumber, styleColoursizeId) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, styleNumber, styleColoursizeId });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: `/style/basic/colour/${ styleNumber }/${ styleColoursizeId }`,
      method: 'delete',
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksStyleColourDelete, funcApiConfig: { argsWarden } };
