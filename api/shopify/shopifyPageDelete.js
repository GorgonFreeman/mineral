// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageDelete

const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const validatorsByArg = {
  credsPayload: credsValidator,
  pageId: Boolean,
};

const shopifyPageDelete = async (
  credsPayload,
  pageId,
  {
    apiVersion,
  } = {},
) => {

  const argsRejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, pageId });
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
  argNames: ['credsPayload', 'pageId'],
  validatorsByArg,
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
