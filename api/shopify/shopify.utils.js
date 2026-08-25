const { DEFAULT_API_VERSION } = require('../shopify/shopify.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  fetchClientCommonSteps,
  jsonlToObjectArray,
  pathAsArray,
  objectDigNodeAtPath,
  sentenceCaseString,
} = require('../utils');

const handleMutationUserErrors = async (state) => {
  const { response } = state;
  const mutationPayload = response?.data;

  if (!response?.ok || !mutationPayload || typeof mutationPayload !== 'object') {
    return {};
  }

  const { userErrors, ...mutationResult } = mutationPayload;

  if (!Array.isArray(userErrors)) {
    return {};
  }

  if (userErrors.length) {
    const message = userErrors
      .map((userError) => userError?.message)
      .filter(Boolean)
      .join('; ');

    return {
      response: {
        ok: false,
        error: {
          code: 'USER_ERROR',
          message: message || 'Mutation failed',
          details: userErrors,
        },
        ...(Object.keys(mutationResult).length ? { data: mutationResult } : {}),
      },
      breakChain: true,
    };
  }

  return {
    response: {
      data: mutationResult,
    },
  };
};

const useUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const {
    apiVersion = DEFAULT_API_VERSION,
    creds,
  } = context;
  const {
    STORE_HANDLE,
    API_KEY,
  } = creds;

  const baseUrl = `https://${ STORE_HANDLE }.myshopify.com/admin/api/${ apiVersion }/graphql.json`;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(baseUrl, requestPayload.url),
      headers: {
        'X-Shopify-Access-Token': API_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const useStorefrontUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const {
    apiVersion = DEFAULT_API_VERSION,
    creds,
  } = context;
  const {
    STORE_HANDLE,
    STOREFRONT_API_KEY,
  } = creds;

  const baseUrl = `https://${ STORE_HANDLE }.myshopify.com/api/${ apiVersion }/graphql.json`;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(baseUrl, requestPayload.url),
      headers: {
        'X-Shopify-Storefront-Access-Token': STOREFRONT_API_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const movePageInfoToMeta = async (state) => {
  const { response, context } = state;
  const { resultPath } = context ?? {};

  if (!response?.ok || !response?.data || !resultPath) {
    return {};
  }

  const connection = objectDigNodeAtPath(response.data, pathAsArray(resultPath));

  if (!connection || typeof connection !== 'object') {
    return {};
  }

  const meta = {
    ...connection.pageInfo ? { pageInfo: connection.pageInfo } : {},
    ...connection.totalCount !== undefined ? { totalCount: connection.totalCount } : {},
    ...connection.productFilters !== undefined ? { productFilters: connection.productFilters } : {},
  };

  if (!Object.keys(meta).length) {
    return {};
  }

  return {
    response: {
      meta,
    },
  };
};

// https://shopify.dev/docs/api/usage/bulk-operations/queries
const parseShopifyJsonl = (jsonl) => {
  const objects = jsonlToObjectArray(jsonl);
  const objectsMap = new Map();
  const objectsWithoutStitching = [];

  for (const object of objects) {
    const {
      id: gid,
      __parentId: parentGid,
    } = object;

    if (!gid) {
      objectsWithoutStitching.push(object);
      continue;
    }

    const [objectType] = gid.split('gid://shopify/')[1].split(/[^a-zA-Z0-9]+/);

    objectsMap.set(gid, {
      ...object,
      selfType: objectType,
      ...parentGid && { parentGid },
    });
  }

  const objectTypeToProperty = (objectType) => `${ sentenceCaseString(objectType) }s`;

  for (const [gid, object] of objectsMap) {
    const {
      selfType,
      parentGid,
    } = object;

    if (!parentGid) {
      continue;
    }

    const objectProperty = objectTypeToProperty(selfType);

    let parentObject = objectsMap.get(parentGid);
    if (!parentObject) {
      continue;
    }

    const nestedParent = gid.split('?')?.[1];

    if (nestedParent) {
      let [nestedParentType] = nestedParent.split('=');
      nestedParentType = nestedParentType
        .replaceAll('_id', '')
        .split('_')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join('');
      nestedParentType = sentenceCaseString(nestedParentType);
      parentObject = parentObject[nestedParentType];
    }

    if (!parentObject) {
      continue;
    }

    parentObject[objectProperty] = parentObject[objectProperty] || [];
    parentObject[objectProperty].push(objectsMap.get(gid));
  }

  const topLevelObjects = Array.from(objectsMap.values()).filter((object) => !object?.parentGid);

  return [
    ...topLevelObjects,
    ...objectsWithoutStitching,
  ];
};

const shopifyClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndAuthHeaders,
    'fetch',
    movePageInfoToMeta,
    fetchClientCommonSteps.stripEdgesAndNodes,
    fetchClientCommonSteps.collapseDataWithOneValue,
    fetchClientCommonSteps.exitEarlyOnNotOk,
    fetchClientCommonSteps.exitEarlyOnGraphqlErrors,
    fetchClientCommonSteps.digToPath,
    handleMutationUserErrors,
  ],
});

const shopifyStorefrontClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useStorefrontUrlAndAuthHeaders,
    'fetch',
    movePageInfoToMeta,
    fetchClientCommonSteps.stripEdgesAndNodes,
    fetchClientCommonSteps.collapseDataWithOneValue,
    fetchClientCommonSteps.exitEarlyOnNotOk,
    fetchClientCommonSteps.exitEarlyOnGraphqlErrors,
    fetchClientCommonSteps.digToPath,
    handleMutationUserErrors,
  ],
});

module.exports = {
  parseShopifyJsonl,
  shopifyClient,
  shopifyStorefrontClient,
};
