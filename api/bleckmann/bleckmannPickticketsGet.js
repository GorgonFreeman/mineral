// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/PICKTICKET/getPicktickets

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { MAX_PER_PAGE } = require('../bleckmann/bleckmann.constants');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const bleckmannPickticketsGet = async (
  credsPayload,
  {
    createdFrom,
    createdTo,
    shippedFrom,
    shippedTo,
    // status default is INPROGRESS in the API; use ANY unless provided
    status = 'ANY',
    reference,
    customerReference,
    perPage = MAX_PER_PAGE,
    fetchClient = bleckmannClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      url: '/warehousing/picktickets',
      params: {
        limit: perPage,
        ...(createdFrom && { createdFrom }),
        ...(createdTo && { createdTo }),
        ...(shippedFrom && { shippedFrom }),
        ...(shippedTo && { shippedTo }),
        ...(status && { status }),
        ...(reference && { reference }),
        ...(customerReference && { customerReference }),
      },
    },
    context: {
      credsPayload,
      resultPath: 'data',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  bleckmannPickticketsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/bleckmannPickticketsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "bleckmann" },
    "options": { "perPage": 20 }
  }'
*/
