// https://api-docs.starshipit.com/#abbdf631-21c8-472b-b2e7-b1b68b01f6d0

const { ArgsWarden, credsFromPayload } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const starshipitOrdersListShipped = async (
  credsPayload,
  {
    sinceLastUpdated,
    idsOnly,
    perPage,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const response = await starshipitClient.fetch({
    requestPayload: {
      url: '/orders/shipped',
      params: {
        ...sinceLastUpdated && { since_last_updated: sinceLastUpdated },
        ...idsOnly && { ids_only: idsOnly },
        ...perPage && { limit: perPage },
      },
    },
    context: {
      creds,
    },
  });

  if (!response?.ok) {
    return response;
  }

  return {
    ...response,
    data: response.data?.orders || response.data?.order_ids || response.data,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitOrdersListShipped,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitOrdersListShipped" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" }
  }'
*/
