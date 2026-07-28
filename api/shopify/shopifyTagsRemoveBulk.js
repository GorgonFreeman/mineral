// https://shopify.dev/docs/api/admin-graphql/latest/mutations/tagsRemove

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyBulkMutationDo } = require('./shopifyBulkMutationDo');

const tagsRemoveBulkMutation = `
  mutation call($id: ID!, $tags: [String!]!) {
    tagsRemove(id: $id, tags: $tags) {
      node {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['gids', Array.isArray],
  ['tags', Array.isArray],
]);

const shopifyTagsRemoveBulk = async (
  credsPayload,
  gids,
  tags,
  {
    ...bulkMutationOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    gids,
    tags,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyBulkMutationDo(
    credsPayload,
    {
      mutation: tagsRemoveBulkMutation,
      input: {
        data: gids.map((gid) => ({
          id: gid,
          tags,
        })),
      },
    },
    bulkMutationOptions,
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyTagsRemoveBulk,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyTagsRemoveBulk" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "gids": ["gid://shopify/Customer/123", "gid://shopify/Customer/456"],
    "tags": ["martian_sympathisers"]
  }'
*/
