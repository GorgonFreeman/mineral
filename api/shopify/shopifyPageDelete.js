// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageDelete

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['pageId'],
]);

const shopifyPageDelete = async (
  credsPayload,
  pageId,
  {
    apiVersion,
  } = {},
) => {

  const argsRejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    pageId,
  });
  if (argsRejectResponse) {
    return argsRejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'pageDelete',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: `gid://shopify/Page/${ pageId }`,
        },
      },
      returnSchema: 'deletedPageId',
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyPageDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyPageDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "shopify.au"
    },
    "pageId": "104188477512"
  }'
*/
