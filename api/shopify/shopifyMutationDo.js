const { credsFromPayload } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const shopifyMutationDo = async (
  credsPayload,
  mutationName,
  {
    mutationVariables = {},
    returnSchema,
    apiVersion,
    ...clientOptions
  } = {},
) => {

  if (!credsValidator(credsPayload)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'Invalid creds',
      },
    };
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
      resultsNode: mutationName,
    },
    ...clientOptions,
  });

  logDeep(response);
  return response;
};

const funcApiConfig = {
  argNames: ['credsPayload', 'mutationName', 'options'],
  validatorsByArg: {
    credsPayload: credsValidator,
    mutationName: Boolean,
  },
};

module.exports = {
  shopifyMutationDo,
  funcApiConfig,
};
