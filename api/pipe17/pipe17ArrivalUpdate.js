// https://apidoc.pipe17.com/#/operations/updateArrival

const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17Client } = require('../pipe17/pipe17.utils');
const { pipe17ArrivalGet } = require('../pipe17/pipe17ArrivalGet');

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
  ['updatePayload'],
]);

const pipe17ArrivalUpdate = async (
  credsPayload,
  arrivalIdentifier,
  updatePayload,
  {
    inspect = false,
    fetchClient = pipe17Client,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    arrivalIdentifier,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  let { arrivalId } = arrivalIdentifier;

  if (!arrivalId) {
    const arrivalResponse = await pipe17ArrivalGet(
      credsPayload,
      arrivalIdentifier,
      { fetchClient },
    );

    if (!arrivalResponse.ok) {
      return arrivalResponse;
    }

    arrivalId = arrivalResponse.data?.arrivalId;
  }

  if (!arrivalId) {
    return {
      ok: false,
      error: {
        code: 'ARRIVAL_ID_NOT_FOUND',
        message: 'Arrival ID not found',
      },
    };
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/arrivals/${ arrivalId }`,
      body: updatePayload,
    },
    context: { credsPayload },
    inspect,
  });

  if (!response.ok) {
    return response;
  }

  const arrival = response.data?.result?.arrival
    ?? response.data?.arrival;
  if (arrival !== undefined) {
    return {
      ...response,
      data: arrival,
    };
  }

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17ArrivalUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17ArrivalUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "arrivalIdentifier": { "arrivalId": "d22afa93793be1f1" },
    "updatePayload": { "senderName": "test" }
  }'
*/
