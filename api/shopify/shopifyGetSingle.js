const { capitaliseString, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const resourcesNotRequiringId = ['shop'];

const defaultAttrs = 'id';

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['resource'],
  ['id', (id, context) => resourcesNotRequiringId.includes(context.resource) || Boolean(id)],
]);

const shopifyGetSingle = async (
  credsPayload,
  resource,
  id,
  {
    apiVersion,
    attrs = defaultAttrs,
    gidType,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs(
    { 
      credsPayload, 
      resource, 
      id, 
    },
    { resource },
  );
  if (rejectResponse) {
    return rejectResponse;
  }

  const Resource = capitaliseString(resource);
  const usesId = !resourcesNotRequiringId.includes(resource);

  const query = `
    query Get${ Resource }${ usesId ? '($id: ID!)' : '' } {
      ${ resource }${ usesId ? '(id: $id)' : '' } {
        ${ attrs }
      }
    }
  `;

  const response = await shopifyClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query,
        variables: {
          ...(usesId ? { id: `gid://shopify/${ gidType || Resource }/${ id }` } : {}),
        },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: `data.${ resource }`,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyGetSingle,
  funcApiConfig,
};
/*

curl -X POST "http://localhost:8000/shopifyGetSingle" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsObject": {
        "STORE_HANDLE": "arisawa-heavy-industries",
        "API_KEY": "shpat_xxx"
      }
    },
    "resource": "order",
    "id": "1234567890",
    "options": {
      "attrs": "id name"
    }
  }'

curl -X POST "http://localhost:8000/shopifyGetSingle" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "shopify.au"
    },
    "resource": "shop",
    "options": {
      "attrs": "id name primaryDomain { url } myshopifyDomain"
    }
  }'
  */
