// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Style_>_Details-update_2

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['styleNumber'],
  ['stylePayload'],
]);

const threeclicksStyleUpdate = async (
  credsPayload,
  styleNumber,
  stylePayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    styleNumber,
    stylePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return threeclicksClient.fetch({
    requestPayload: {
      url: `/style/basic/${ styleNumber }`,
      method: 'patch',
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
  threeclicksStyleUpdate,
  funcApiConfig,
};
