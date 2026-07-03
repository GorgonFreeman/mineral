const { credsFromPayload, logDeep, responseIfRejectingArgs } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
  mutationName: Boolean,
};

const shopifyMutationDo = async (
  credsPayload,
  mutationName,
  {
    mutationVariables = {},
    returnSchema = '',
    apiVersion,
    ...clientOptions
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, mutationName });
  if (rejectResponse) {
    return rejectResponse;
  }

  if (!returnSchema?.includes('userErrors')) {
    returnSchema += ' userErrors { field message }';
  }

  const creds = await credsFromPayload(credsPayload);

  const mutation = `
    mutation ${ mutationName }(${ Object.entries(mutationVariables).map(([name, { type }]) => `$${ name }: ${ type }`).join(', ') }) {
      ${ mutationName }(${ Object.keys(mutationVariables).map(name => `${ name }: $${ name }`).join(', ') }) {
        ${ returnSchema }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {};
  for (const [name, { value }] of Object.entries(mutationVariables)) {
    variables[name] = value;
  }

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query: mutation, variables },
    context: {
      creds,
      apiVersion,
      resultPath: `data.${ mutationName }`,
    },
    ...clientOptions,
  });

  logDeep(response);
  return response;
};

const funcApiConfig = {
  argNames: ['credsPayload', 'mutationName'],
  validatorsByArg,
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
