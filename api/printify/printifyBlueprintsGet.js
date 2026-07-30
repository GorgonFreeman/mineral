// https://developers.printify.com/#retrieve-a-list-of-available-blueprints

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const printifyBlueprintsGet = async (
  credsPayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  return printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/catalog/blueprints.json',
    },
    context: { credsPayload },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyBlueprintsGet,
  funcApiConfig,
};
