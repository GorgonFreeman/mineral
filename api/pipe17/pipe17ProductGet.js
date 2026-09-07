// https://apidoc.pipe17.com/#/operations/fetchProduct

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17GetSingle } = require('../pipe17/pipe17.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['productId'],
]);

const pipe17ProductGet = async (
  credsPayload,
  productId,
  {
    inspect = false,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    productId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return pipe17GetSingle(
    credsPayload,
    '/products',
    productId,
    {
      resultPath: 'product',
      inspect,
      fetchClient,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17ProductGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17ProductGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "productId": "3f91e016e3d433e8"
  }'
*/
