const { credsFromPayload, capitaliseString } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyClient } = require('./shopify.utils');

const defaultAttrs = 'id';

const gidFromId = (id, resource, { gidType } = {}) => {
  if (id?.startsWith('gid://')) {
    return id;
  }

  const resourceType = gidType || capitaliseString(resource);
  return `gid://shopify/${ resourceType }/${ id }`;
};

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
  const isShopResource = resource === 'shop';

  const query = `
    query Get${ Resource }${ isShopResource ? '' : '($id: ID!)' } {
      ${ resource }${ isShopResource ? '' : '(id: $id)' } {
        ${ attrs }
      }
    }
  `;

  const response = await shopifyClient.fetch({
    method: 'post',
    body: {
      query,
      ...isShopResource
        ? {}
        : {
          variables: {
            id: gidFromId(id, resource, { gidType }),
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
  requestHandler: async ({ body }) => {
    const normalisedBody = {
      ...body,
      options: body?.options || {},
    };

    return {
      body: normalisedBody,
    };
  },
  argNames: ['credsPayload', 'resource', 'id', 'options'],
  validatorsByArg: {
    credsPayload: (credsPayload) => credsValidator(credsPayload),
    resource: (resource) => Boolean(resource),
    id: (id, body) => body?.resource === 'shop' || Boolean(id),
  },
};

module.exports = {
  shopifyGetSingle,
  funcApiConfig,
};
