// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageUpdate

const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const validatorsByArg = {
  credsPayload: credsValidator,
  pageId: Boolean,
  updatePayload: Boolean,
};

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

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, pageId, updatePayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
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
};

const funcApiConfig = {
  argNames: ['credsPayload', 'pageId', 'updatePayload'],
  validatorsByArg,
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
