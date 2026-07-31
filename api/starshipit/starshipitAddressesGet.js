const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitGet } = require('../starshipit/starshipitGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const starshipitAddressesGet = async (
  credsPayload,
  {
    page = 1,
    perPage,
    sort,
    sortDirection,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return starshipitGet(credsPayload, '/addressbook/filtered', {
    nodeName: 'addresses',
    params: {
      ...page && { page },
      ...perPage && { page_size: perPage },
      ...sort && { sort },
      ...sortDirection && { sort_direction: sortDirection },
    },
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitAddressesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitAddressesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" }
  }'
*/
