// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageDelete

const { credsValidator } = require('../validators');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const shopifyPageDelete = async (
  credsPayload,
  pageId,
  {
    apiVersion,
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

  if (!pageId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'pageId is required',
      },
    };
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
  validatorsByArg: {
    credsPayload: credsValidator,
    pageId: Boolean,
  },
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
