// https://developers.printify.com/#retrieve-list-of-shops-in-a-printify-account

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyGet, printifyGetter } = require('../printify/printifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const printifyShopsGet = async (
  returnGetter,

  credsPayload,
  {
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    '/shops.json',
    {
      ...getterOptions,
    },
  ];

  return returnGetter
    ? printifyGetter(...getterArgs)
    : printifyGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyShopsGet: (...args) => printifyShopsGet(false, ...args),
  printifyShopsGetter: (...args) => printifyShopsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/printifyShopsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "printify" }
  }'
*/
