// https://developers.printify.com/#api-reference
 
const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['arg'],
]);

const printifyShopsGet = async (
  credsPayload,
  arg,
  {
    shopId,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, arg });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/shops/${ shopId }/things/${ arg }.json`,
    },
    context: { credsPayload },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyShopsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/printifyShopsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "printify" },
    "arg": "1234",
    "options": { "shopId": "1234567890" }
  }'
*/
