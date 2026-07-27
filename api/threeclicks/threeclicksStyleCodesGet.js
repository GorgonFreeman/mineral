// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const STYLE_CODE_TYPES = ['brand', 'category', 'collection', 'type'];

const codesForValidator = (codesFor) => STYLE_CODE_TYPES.includes(codesFor);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['codesFor', codesForValidator],
]);

const threeclicksStyleCodesGet = async (credsPayload, codesFor) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, codesFor });
  if (rejectResponse) return rejectResponse;
  return threeclicksClient.fetch({
    requestPayload: {
      url: `/site-settings/style/${ codesFor }`,
      method: 'get',
    },
    context: {
      credsPayload,
    },
  });
};

module.exports = { threeclicksStyleCodesGet, funcApiConfig: { argsWarden } };
