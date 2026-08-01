// https://developers.etsy.com/documentation/reference/#operation/getUser

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['userId'],
]);

const etsyUserGet = async (
  credsPayload,
  userId,
  {
    params,
    inspect = false,
    fetchClient = etsyClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    userId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/users/${ userId }`,
      ...(params && { params }),
    },
    context: {
      credsPayload,
      withAccessToken: true,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyUserGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyUserGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "userId": "123456789"
  }'
*/
