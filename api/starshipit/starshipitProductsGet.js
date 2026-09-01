// https://api-docs.starshipit.com/#ccf0f10f-e370-45c0-ba5c-13bfaac80ca6

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitGet } = require('../starshipit/starshipitGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const starshipitProductsGet = async (
  credsPayload,
  {
    searchTerm,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return starshipitGet(credsPayload, '/products', {
    nodeName: 'products',
    params: {
      ...searchTerm && { search_term: searchTerm },
    },
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitProductsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitProductsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" },
    "options": { "searchTerm": "WFAL48-1-S" }
  }'

  curl -X POST "http://localhost:8000/starshipitProductsGet" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "starshipit.wf" },
      "options": { "limit": 20 }
    }'
*/
