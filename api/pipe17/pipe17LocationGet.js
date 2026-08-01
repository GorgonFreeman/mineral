// https://apidoc.pipe17.com/#/operations/fetchLocation

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17GetSingle } = require('../pipe17/pipe17.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['locationId'],
]);

const pipe17LocationGet = async (
  credsPayload,
  locationId,
  {
    inspect = false,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    locationId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return pipe17GetSingle(
    credsPayload,
    '/locations',
    locationId,
    {
      resultKey: 'location',
      inspect,
      fetchClient,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17LocationGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17LocationGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "locationId": "6d9c18617ea2d279"
  }'
*/
