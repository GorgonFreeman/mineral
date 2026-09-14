const { logDeep, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['mutationName'],
]);

const shopifyMutationDo = async (
  credsPayload,
  mutationName,
  {
    mutationVariables = {},
    returnSchema = '',
    apiVersion,
    idempotencyKey,
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

  if (!returnSchema?.includes('userErrors')) {
    returnSchema += ' userErrors { field message }';
  }

  const argumentEntries = Object.entries(mutationVariables);
  const variableEntries = [
    ...argumentEntries,
    ...idempotencyKey ? [['idempotencyKey', { type: 'String!', value: idempotencyKey }]] : [],
  ];

  const mutation = `
    mutation ${ mutationName }(${ variableEntries.map(([name, { type }]) => `$${ name }: ${ type }`).join(', ') }) {
      ${ mutationName }(${ argumentEntries.map(([name]) => `${ name }: $${ name }`).join(', ') })${ idempotencyKey ? ' @idempotent(key: $idempotencyKey)' : '' } {
        ${ returnSchema }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = Object.fromEntries(
    variableEntries.map(([name, { value }]) => [name, value]),
  );

  const response = await shopifyClient.fetch({
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

  // logDeep(response);
  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMutationDo,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMutationDo" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "shopify.au"
    },
    "mutationName": "tagsAdd",
    "options": {
      "mutationVariables": {
        "id": {
          "value": "gid://shopify/Order/7693468893256",
          "type": "ID!"
        },
        "tags": {
          "value": ["test-tag"],
          "type": "[String!]!"
        }
      },
      "returnSchema": "order { id name }"
    }
  }'
*/
