// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Style-delete

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['styleNumber'],
]);

const threeclicksStyleDelete = async (credsPayload, styleNumber) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, styleNumber });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: `/style/${ styleNumber }`,
      method: 'delete',
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksStyleDelete, funcApiConfig: { argsWarden } };
