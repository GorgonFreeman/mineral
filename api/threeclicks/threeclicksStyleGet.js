// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['styleNumber'],
]);

const threeclicksStyleGet = async (
  credsPayload,
  styleNumber,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    styleNumber,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return threeclicksClient.fetch({
    requestPayload: {
      url: `/style/basic/${ styleNumber }`,
      method: 'get',
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
  threeclicksStyleGet,
  funcApiConfig,
};
