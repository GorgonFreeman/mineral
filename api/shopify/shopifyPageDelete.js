// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageDelete

const { credsValidator } = require('../validators');
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

  const rejectArgsMessages = validateArgs(validatorsByArg, { credsPayload, pageId });
  if (rejectArgsMessages.length > 0) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARGS',
        ...(rejectArgsMessages.length === 1 ? { message: rejectArgsMessages[0] } : {}),
        ...(rejectArgsMessages.length > 1 ? { details: rejectArgsMessages } : {}),
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
