// https://shopify.dev/docs/api/admin-graphql/latest/queries/page

const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = 'id title handle templateSuffix';

const validatorsByArg = {
  credsPayload: credsValidator,
  pageId: Boolean,
};

const shopifyPageGet = async (
  credsPayload,
  pageId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, pageId });
  if (rejectResponse) {
    return rejectResponse;
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
  validatorsByArg,
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
