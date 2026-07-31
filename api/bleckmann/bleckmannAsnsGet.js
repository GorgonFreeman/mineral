// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/ASN/getAsns

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { MAX_PER_PAGE } = require('../bleckmann/bleckmann.constants');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const bleckmannAsnsGet = async (
  credsPayload,
  {
    createdFrom,
    createdTo,
    receivedFrom,
    receivedTo,
    status,
    perPage = MAX_PER_PAGE,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await bleckmannClient.fetch({
    requestPayload: {
      url: '/warehousing/asns',
      params: {
        limit: perPage,
        ...(createdFrom && { createdFrom }),
        ...(createdTo && { createdTo }),
        ...(receivedFrom && { receivedFrom }),
        ...(receivedTo && { receivedTo }),
        ...(status && { status }),
      },
    },
    context: {
      credsPayload,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  bleckmannAsnsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/bleckmannAsnsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "bleckmann" },
    "options": { "perPage": 20 }
  }'
*/
