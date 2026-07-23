// https://loyaltyapi.yotpo.com/reference/fetch-all-recently-updated-customers

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const yotpoCustomersRecentGet = async (
  credsPayload,
  {
    apiVersion,
    pageInfo,
    perPage,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const params = {
    ...(pageInfo && { page_info: pageInfo }),
    ...(perPage !== undefined && { per_page: perPage }),
  };

  const response = await yotpoClient.fetch({
    requestPayload: {
      url: '/customers/recent',
      params,
    },
    context: {
      credsPayload,
      apiVersion,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
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
