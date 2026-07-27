// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Style_>_Details-colourCreate

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['styleNumber'],
  ['colourPayload'],
]);

const threeclicksStyleColourCreate = async (
  credsPayload,
  styleNumber,
  colourPayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    styleNumber,
    colourPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return threeclicksClient.fetch({
    requestPayload: {
      url: `/style/basic/colour/${ styleNumber }`,
      method: 'post',
      body: colourPayload,
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
  threeclicksStyleColourCreate,
  funcApiConfig,
};
