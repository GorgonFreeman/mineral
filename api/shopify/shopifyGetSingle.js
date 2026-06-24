const { credsFromPayload, capitaliseString } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const resourcesNotRequiringId = ['shop'];

const defaultAttrs = 'id';

const shopifyGetSingle = async (
  credsPayload,
  resource,
  id,
  {
    apiVersion = '2024-10',
    attrs = defaultAttrs,
    gidType,
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

  const creds = credsFromPayload(credsPayload);

  const Resource = capitaliseString(resource);
  const usesId = !resourcesNotRequiringId.includes(resource);

  const query = `
    query Get${ Resource }${ usesId ? '' : '($id: ID!)' } {
      ${ resource }${ usesId ? '' : '(id: $id)' } {
        ${ attrs }
      }
    }
  `;

  const response = await shopifyClient.fetch({
    method: 'post',
    body: {
      query,
      ...usesId
        ? {}
        : {
          variables: {
            id: `gid://shopify/${ gidType || Resource }/${ id }`,
          },
        },
    },
    context: {
      creds,
      apiVersion,
      resultPath: `data.${ resource }`,
    },
  });

  return response;
};

const funcApiConfig = {
  argNames: ['credsPayload', 'resource', 'id', 'options'],
  validatorsByArg: {
    credsPayload: (credsPayload) => credsValidator(credsPayload),
    resource: (resource) => Boolean(resource),
    id: (id, body) => resourcesNotRequiringId.includes(body?.resource) || Boolean(id),
  },
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
      "credsObject": {
        "STORE_HANDLE": "arisawa-heavy-industries",
        "API_KEY": "shpat_xxx"
      }
    },
    "resource": "shop",
    "options": {
      "attrs": "id name primaryDomain { url } myshopifyDomain"
    }
  }'
  */