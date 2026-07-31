// https://shopify.dev/docs/api/admin-graphql/latest/queries/page

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = 'id title handle templateSuffix';

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['pageId', Boolean],
]);

const shopifyPageGet = async (
  credsPayload,
  pageId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    pageId,
  });
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
  argsWarden,
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
