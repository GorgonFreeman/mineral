// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/PICKTICKET/getPickticketForId

const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAny, oneFromManyInResponse } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');
const { bleckmannPickticketsGet } = require('../bleckmann/bleckmannPickticketsGet');

const pickticketIdentifierValidator = (pickticketIdentifier) => {
  return objHasAny(pickticketIdentifier, ['pickticketId', 'pickticketReference']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['pickticketIdentifier', pickticketIdentifierValidator],
]);

const bleckmannPickticketGet = async (
  credsPayload,
  pickticketIdentifier,
  {
    fetchClient = bleckmannClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    pickticketIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    pickticketId,
    pickticketReference,
  } = pickticketIdentifier;

  if (pickticketId) {
    return fetchClient.fetch({
      requestPayload: {
        url: `/warehousing/picktickets/${ pickticketId }`,
      },
      context: {
        credsPayload,
      },
    });
  }

  const response = await bleckmannPickticketsGet(
    credsPayload,
    {
      reference: pickticketReference,
      fetchClient,
    },
  );

  return oneFromManyInResponse(response, 'reference', pickticketReference);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  bleckmannPickticketGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/bleckmannPickticketGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "bleckmann" },
    "pickticketIdentifier": { "pickticketReference": "1234567890" }
  }'
*/
