// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['stylePayload'],
]);

const threeclicksStyleCreate = async (
  credsPayload,
  stylePayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    stylePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return threeclicksClient.fetch({
    requestPayload: {
      url: '/style',
      method: 'post',
      body: stylePayload,
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
  threeclicksStyleCreate,
  funcApiConfig,
};
