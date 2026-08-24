// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectCreate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const metaobjectInputValidator = (metaobjectInput) => Boolean(metaobjectInput?.type);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['metaobjectInput', metaobjectInputValidator],
]);

const defaultReturnMetaobjectAttrs = 'id handle type updatedAt';

const shopifyMetaobjectCreate = async (
  credsPayload,
  metaobjectInput,
  {
    apiVersion,
    returnMetaobjectAttrs = defaultReturnMetaobjectAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    metaobjectInput,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'metaobjectCreate',
    {
      mutationVariables: {
        metaobject: {
          type: 'MetaobjectCreateInput!',
          value: metaobjectInput,
        },
      },
      returnSchema: `metaobject { ${ returnMetaobjectAttrs } }`,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMetaobjectCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetaobjectCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.white-fox-us-dev-radial" },
    "metaobjectInput": {
      "type": "your_metaobject_type",
      "handle": "optional-unique-handle",
      "fields": [
        { "key": "title", "value": "Example" },
        { "key": "body", "value": "Some content" }
      ]
    }
  }'
*/
