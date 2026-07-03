// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageUpdate

const { credsValidator } = require('../validators');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const shopifyPageUpdate = async (
  credsPayload,
  pageId,
  updatePayload,
  /*
    body,
    title,
    handle,
    redirectNewHandle,
    isPublished,
    publishDate,
    metafields,
    templateSuffix,
  */
  {
    apiVersion,
    returnPageAttrs = 'title handle templateSuffix',
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

  const response = await shopifyMutationDo(
    credsPayload,
    'pageUpdate',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: `gid://shopify/Page/${ pageId }`,
        },
        page: {
          type: 'PageUpdateInput!',
          value: updatePayload,
        },
      },
      returnSchema: `page { ${ returnPageAttrs } }`,
      apiVersion,
    },
  );

  return response;
};

const funcApiConfig = {
  argNames: ['credsPayload', 'pageId', 'updatePayload', 'options'],
  validatorsByArg: {
    credsPayload: credsValidator,
    pageId: Boolean,
    updatePayload: Boolean,
  },
};

module.exports = {
  shopifyPageUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyPageUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "shopify.au"
    },
    "pageId": "104188477512",
    "updatePayload": {
      "templateSuffix": "styleguide"
    }
  }'
*/
