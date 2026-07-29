// https://developers.printify.com/#api-reference
 
const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const printifyShopsGet = async (
  credsPayload,
  {
    option,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ 
    credsPayload, 
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/shops.json`,
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
    "credsPayload": { "credsPath": "printify" }
  }'
*/
