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
    || (extArrivalId ? `ext:${ extArrivalId }` : null)
    || (extArrivalApiId ? `api:${ extArrivalApiId }` : null)
    || (extReferenceId ? `ref:${ extReferenceId }` : null);
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
      resultPath: 'result.arrival',
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
    "arrivalIdentifier": { "arrivalId": "d22afa93793be1f1" }
  }'
*/
