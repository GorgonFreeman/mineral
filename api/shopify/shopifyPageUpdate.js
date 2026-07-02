// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageUpdate

const { credsValidator } = require('../validators');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const pageIdToGid = (pageId) => {
  if (String(pageId).startsWith('gid://')) {
    return pageId;
  }

  return `gid://shopify/Page/${ pageId }`;
};

const shopifyPageUpdate = async (
  credsPayload,
  pageId,
  {
    template,
    templateSuffix = template,
    apiVersion,
    ...pageFields
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

  if (templateSuffix === undefined) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'template or templateSuffix is required',
      },
    };
  }

  const page = {
    ...pageFields,
    templateSuffix,
  };

  const response = await shopifyMutationDo(
    credsPayload,
    'pageUpdate',
    {
      mutationVariables: {
        id: {
          value: pageIdToGid(pageId),
          type: 'ID!',
        },
        page: {
          value: page,
          type: 'PageUpdateInput!',
        },
      },
      returnSchema: 'page { id title handle templateSuffix }',
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
