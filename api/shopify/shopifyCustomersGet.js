const { credsFromPayload, responseIfRejectingArgs, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
};

const shopifyCustomersGet = async (
  credsPayload,
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { 
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const customers = [];

  const getter = new Getter(
    // {
    //   url: '/customers',
    // },
    {
      fetchClient: shopifyClient,
    },
  );

  getter.on('items', (items) => {
    console.log('items', items.length);
    customers.push(...items);
  });

  getter.on('done', () => {
    console.log('done', customers.length);
  });

  await getter.run();

  return {
    ok: true,
    data: customers,
  };
};

const funcApiConfig = {
  argNames: [
    'credsPayload',
  ],
  validatorsByArg,
};

module.exports = {
  shopifyCustomersGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCustomersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" }
  }'
*/
