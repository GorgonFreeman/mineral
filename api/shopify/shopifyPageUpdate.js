// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageUpdate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['pageId'],
  ['updatePayload'],
]);

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

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, pageId, updatePayload });
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
  argsWarden,
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
