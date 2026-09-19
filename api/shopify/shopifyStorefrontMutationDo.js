const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['mutationName'],
]);

const shopifyStorefrontMutationDo = async (
  credsPayload,
  mutationName,
  {
    mutationVariables = {},
    returnSchema = '',
    apiVersion,
    inContext,
    fetchClient = shopifyStorefrontClient,
    ...clientOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    mutationName,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const isCustomerMutation = mutationName.startsWith('customer');
  const errorField = isCustomerMutation ? 'customerUserErrors' : 'userErrors';

  if (!returnSchema?.includes(errorField)) {
    returnSchema += ` ${ errorField } { field message }`;
  }

  const argumentEntries = Object.entries(mutationVariables);
  const inContextDirective = buildInContextDirective(inContext);
  const variableDefs = argumentEntries
    .map(([name, { type }]) => `$${ name }: ${ type }`)
    .join(', ');
  const argumentUses = argumentEntries
    .map(([name]) => `${ name }: $${ name }`)
    .join(', ');

  const mutation = `
    mutation ${ mutationName }${ variableDefs ? `(${ variableDefs })` : '' }${ inContextDirective } {
      ${ mutationName }${ argumentUses ? `(${ argumentUses })` : '' } {
        ${ returnSchema }
      }
    }
  `;

  const variables = Object.fromEntries(
    argumentEntries.map(([name, { value }]) => [name, value]),
  );

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: { query: mutation, variables },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: `data.${ mutationName }`,
    },
    ...clientOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontMutationDo,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontMutationDo" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "mutationName": "cartCreate",
    "options": {
      "mutationVariables": {
        "input": {
          "type": "CartInput",
          "value": {
            "lines": [{ "merchandiseId": "gid://shopify/ProductVariant/123", "quantity": 1 }]
          }
        }
      },
      "returnSchema": "cart { id checkoutUrl }"
    }
  }'
*/
