const { credsFromPayload, capitaliseString } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const shopifyResourcesThatUseId = ['shop'];

const defaultAttrs = 'id';

const shopifyGetSingle = async (
  credsPayload,
  resource,
  id,
  options = {},
) => {
  const {
    apiVersion = '2024-10',
    attrs = defaultAttrs,
    gidType,
  } = options;
  const creds = credsFromPayload(credsPayload);

  const Resource = capitaliseString(resource);
  const usesId = shopifyResourcesThatUseId.includes(resource);

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
    id: (id, body) => shopifyResourcesThatUseId.includes(body?.resource) || Boolean(id),
  },
};

module.exports = {
  shopifyGetSingle,
  funcApiConfig,
};
