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
          value: `gid://shopify/Page/${ pageId }`,
          type: 'ID!',
        },
        page: {
          value: updatePayload,
          type: 'PageUpdateInput!',
        },
      },
      returnSchema: `page { ${ returnPageAttrs } }`,
      apiVersion,
    },
  );

  if (!response.ok) {
    return response;
  }

  const { userErrors, page: updatedPage } = response.data ?? {};

  if (userErrors?.length) {
    const message = userErrors
      .map((userError) => userError?.message)
      .filter(Boolean)
      .join('; ');

    return {
      ok: false,
      error: {
        code: 'USER_ERROR',
        message: message || 'Page update failed',
        details: userErrors,
      },
      ...(updatedPage ? { data: updatedPage } : {}),
    };
  }

  return {
    ok: true,
    data: updatedPage,
  };
};

const funcApiConfig = {
  argNames: ['credsPayload', 'pageId', 'options'],
  validatorsByArg: {
    credsPayload: credsValidator,
    pageId: Boolean,
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
    "options": {
      "template": "styleguide"
    }
  }'
*/
