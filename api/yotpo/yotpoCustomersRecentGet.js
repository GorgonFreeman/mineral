// https://loyaltyapi.yotpo.com/reference/fetch-all-recently-updated-customers

const { credsFromPayload, responseIfRejectingArgs } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
};

const yotpoCustomersRecentGet = async (
  credsPayload,
  {
    apiVersion,
    pageInfo,
    perPage,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const params = {
    ...(pageInfo && { page_info: pageInfo }),
    ...(perPage !== undefined && { per_page: perPage }),
  };

  const response = await yotpoClient.fetch({
    url: '/customers/recent',
    params,
    context: {
      creds,
      apiVersion,
    },
  });

  return response;
};

const funcApiConfig = {
  argNames: [
    'credsPayload',
  ],
  validatorsByArg,
};

module.exports = {
  yotpoCustomersRecentGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoCustomersRecentGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" },
    "options": {
      "perPage": 10
    }
  }'
*/
