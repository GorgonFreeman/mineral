// https://shopify.dev/docs/api/admin-graphql/latest/queries/page

const { credsValidator } = require('../validators');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = 'id title handle templateSuffix';

const shopifyPageGet = async (
  credsPayload,
  pageId,
  {
    apiVersion,
    attrs = defaultAttrs,
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

  return shopifyGetSingle(
    credsPayload,
    'page',
    pageId,
    {
      apiVersion,
      attrs,
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
  shopifyPageGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyPageGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "shopify.au"
    },
    "pageId": "104188477512"
  }'
*/
