// https://shopify.dev/docs/api/admin-graphql/latest/mutations/tagsAdd

// TODO: Implement multiple or single functionality

const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const validatorsByArg = {
  credsPayload: credsValidator,
  gid: Boolean,
  tags: Array,
};

const defaultAttrs = 'id';

const shopifyTagsAdd = async (
  credsPayload,
  gid,
  tags,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { 
    credsPayload, 
    gid, 
    tags,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'tagsAdd',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: gid,
        },
        tags: {
          type: '[String!]!',
          value: tags,
        },
      },
      returnSchema: `node { ${ returnAttrs } }`,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argNames: [
    'credsPayload', 
    'gid', 
    'tags',
  ],
  validatorsByArg,
};

module.exports = {
  shopifyTagsAdd,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyTagsAdd" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "gid": "gid://shopify/Product/6981195825224",
    "tags": ["watermelon", "banana"]
  }'
*/
