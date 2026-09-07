// https://apidoc.pipe17.com/#/operations/fetchArrival

const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17GetSingle } = require('../pipe17/pipe17.utils');

const arrivalIdentifierValidator = (arrivalIdentifier) => {
  return objHasAny(arrivalIdentifier, [
    'arrivalId',
    'extArrivalId',
    'extArrivalApiId',
    'extReferenceId',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['arrivalIdentifier', arrivalIdentifierValidator],
]);

const resolveArrivalId = ({
  arrivalId,
  extArrivalId,
  extArrivalApiId,
  extReferenceId,
}) => {
  return arrivalId
    || (extArrivalId ? `ext:${ encodeURIComponent(extArrivalId) }` : null)
    || (extArrivalApiId ? `api:${ encodeURIComponent(extArrivalApiId) }` : null)
    || (extReferenceId ? `ref:${ encodeURIComponent(extReferenceId) }` : null);
};

const pipe17ArrivalGet = async (
  credsPayload,
  arrivalIdentifier,
  {
    inspect = false,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    arrivalIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return pipe17GetSingle(
    credsPayload,
    '/arrivals',
    resolveArrivalId(arrivalIdentifier),
    {
      resultPath: 'arrival',
      inspect,
      fetchClient,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17ArrivalGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17ArrivalGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "arrivalIdentifier": { "arrivalId": "8f146f632e55fd21" }
  }'

curl -X POST "http://localhost:8000/pipe17ArrivalGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "arrivalIdentifier": { "extArrivalId": "US-WF-021" }
  }'
*/
