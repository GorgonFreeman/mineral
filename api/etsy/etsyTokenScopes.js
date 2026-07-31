// https://developers.etsy.com/documentation/reference/#operation/tokenScopes

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['updatePayload'],
]);

const etsyTokenScopes = async (
  credsPayload,
  updatePayload,
  {
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return etsyClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/application/scopes`,
      body: updatePayload,
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
  etsyTokenScopes,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyTokenScopes" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "updatePayload": {
      "token": "<access_token_from_creds>"
    }
  }'
*/
