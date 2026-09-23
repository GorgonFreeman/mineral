// https://developers.cloudflare.com/api/resources/accounts/methods/get/

const {
  ArgsWarden,
  appendUrlToBase,
  credsFromPayload,
  customFetch,
} = require('../utils');
const { credsValidator } = require('../validators');
const { BASE_URL } = require('../cloudflare/cloudflare.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const cloudflareAccountGet = async (
  credsPayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);
  const {
    API_TOKEN,
    ACCOUNT_ID,
  } = creds;

  const url = appendUrlToBase(BASE_URL, `/accounts/${ ACCOUNT_ID }`);

  const response = await customFetch(
    url,
    {
      method: 'get',
      headers: {
        Authorization: `Bearer ${ API_TOKEN }`,
      },
    },
  );

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  cloudflareAccountGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareAccountGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" }
  }'
*/
