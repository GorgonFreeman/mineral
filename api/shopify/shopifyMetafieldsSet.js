// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsset

const { credsValidator } = require('../validators');
const { responseIfRejectingArgs, actionSingleOrMultiple, arrayToChunks } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');
const { MAX_METAFIELDS_PER_SET } = require('../shopify/shopify.constants');

const metafieldsValidator = (metafields) => {
  return Array.isArray(metafields) && metafields.length > 0;
};

const validatorsByArg = {
  credsPayload: credsValidator,
  metafields: metafieldsValidator,
};

const defaultAttrs = 'id namespace key type value';

const shopifyMetafieldsSetChunk = async (
  credsPayload,
  metafields,
  {
    apiVersion,
    returnMetafieldAttrs = defaultAttrs,
  } = {},
) => {

  return shopifyMutationDo(
    credsPayload,
    'metafieldsSet',
    {
      mutationVariables: {
        metafields: {
          type: '[MetafieldsSetInput!]!',
          value: metafields,
        },
      },
      returnSchema: `
        metafields { ${ returnMetafieldAttrs } }
      `.trim(),
      apiVersion,
    },
  );
};

const shopifyMetafieldsSet = async (
  credsPayload,
  metafields,
  {
    queueRunOptions,
    apiVersion,
    returnMetafieldAttrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, {
    credsPayload,
    metafields,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const chunks = arrayToChunks(metafields, MAX_METAFIELDS_PER_SET);

  return actionSingleOrMultiple(
    chunks,
    shopifyMetafieldsSetChunk,
    (chunk) => ({
      args: [credsPayload, chunk, { apiVersion, returnMetafieldAttrs }],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argNames: [
    'credsPayload',
    'metafields',
  ],
  validatorsByArg,
};

module.exports = {
  shopifyMetafieldsSet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetafieldsSet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "metafields": [{
      "ownerId": "gid://shopify/Customer/2111702204488",
      "namespace": "facts",
      "key": "birth_date",
      "type": "date",
      "value": "1990-01-01"
    }]
  }'
*/
