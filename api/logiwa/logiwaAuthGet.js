// https://myapi.logiwa.com/swagger/index.html

const { credsFromPayload, customFetch, appendUrlToBase, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { DEFAULT_API_VERSION } = require('./logiwa.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const logiwaAuthGet = async (
  credsPayload,
  {
    apiVersion = DEFAULT_API_VERSION,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);
  const {
    BASE_URL,
    EMAIL,
    PASSWORD,
  } = creds;

  if (!EMAIL || !PASSWORD) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CREDS',
        message: 'EMAIL and PASSWORD are required.',
      },
    };
  }

  const url = appendUrlToBase(BASE_URL, `/${ apiVersion }/Authorize/token`);

  const response = await customFetch(
    url,
    {
      method: 'post',
      body: {
        email: EMAIL,
        password: PASSWORD,
      },
    },
  );

  if (!response.ok) {
    return response;
  }

  if (!response.data?.token) {
    return {
      ok: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Logiwa did not return a token.',
        details: response.data,
      },
    };
  }

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  logiwaAuthGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaAuthGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" }
  }'
*/
