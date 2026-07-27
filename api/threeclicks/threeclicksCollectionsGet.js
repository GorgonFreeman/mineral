// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const threeclicksCollectionsGet = async (credsPayload) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: '/site-settings/style/collection',
      method: 'get',
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksCollectionsGet, funcApiConfig: { argsWarden } };
