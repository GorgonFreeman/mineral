// https://shopify.dev/docs/api/admin-graphql/latest/queries/collection

const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAny, credsFromPayload } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = 'id title handle';

const collectionIdentifierValidator = (collectionIdentifier) => {
  return objHasAny(collectionIdentifier, [
    'customId',
    'id',
    'handle',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['collectionIdentifier', collectionIdentifierValidator],
]);

const shopifyCollectionGet = async (
  credsPayload,
  collectionIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, collectionIdentifier });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { 
    customId, 
    id, 
    handle,
  } = collectionIdentifier;

  if (!id) {

    const creds = await credsFromPayload(credsPayload);

    const query = `
      query GetCollectionByIdentifier ($identifier: CollectionIdentifierInput!) {
        collection: collectionByIdentifier(identifier: $identifier) {
          ${ attrs }
        }
      }
    `;

    const variables = {
      identifier: {
        ...customId && { customId },
        ...handle && { handle },
      },
    };

    const response = await shopifyClient.fetch({
      method: 'post',
      body: { query, variables },
      context: {
        creds,
        apiVersion,
        resultPath: 'data.collection',
      },
    });

    return response;
  }

  return shopifyGetSingle(
    credsPayload,
    'collection',
    id,
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
  shopifyCollectionGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCollectionGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "collectionIdentifier": { "id": "279980277832" }
  }'

curl -X POST "http://localhost:8000/shopifyCollectionGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "collectionIdentifier": { "handle": "new-arrivals" }
  }'
*/
