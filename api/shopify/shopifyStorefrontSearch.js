// https://shopify.dev/docs/api/storefront/latest/queries/search

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontClient } = require('./shopify.utils');
const { MAX_PER_PAGE } = require('./shopify.constants');

const defaultAttrs = `
  ... on Product {
    id
    handle
    title
  }
  ... on Page {
    id
    handle
    title
  }
  ... on Article {
    id
    handle
    title
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
]);

const shopifyStorefrontSearch = async (
  credsPayload,
  query,
  {
    apiVersion,
    attrs = defaultAttrs,
    first = MAX_PER_PAGE,
    cursor,
    reverse,
    sortKey,
    types,
    prefix,
    productFilters,
    unavailableProducts,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const queryTypeDeclaration = [
    '$query: String!',
    '$first: Int!',
    '$cursor: String',
    ...reverse !== undefined ? ['$reverse: Boolean'] : [],
    ...sortKey ? ['$sortKey: SearchSortKeys'] : [],
    ...types ? ['$types: [SearchType!]'] : [],
    ...prefix ? ['$prefix: SearchPrefixQueryType'] : [],
    ...productFilters ? ['$productFilters: [ProductFilter!]'] : [],
    ...unavailableProducts ? ['$unavailableProducts: SearchUnavailableProductsType'] : [],
  ].join('\n');

  const queryVariableDeclaration = [
    'query: $query',
    'first: $first',
    'after: $cursor',
    ...reverse !== undefined ? ['reverse: $reverse'] : [],
    ...sortKey ? ['sortKey: $sortKey'] : [],
    ...types ? ['types: $types'] : [],
    ...prefix ? ['prefix: $prefix'] : [],
    ...productFilters ? ['productFilters: $productFilters'] : [],
    ...unavailableProducts ? ['unavailableProducts: $unavailableProducts'] : [],
  ].join('\n');

  const variables = {
    query,
    first,
    cursor,
    ...reverse !== undefined && { reverse },
    ...sortKey && { sortKey },
    ...types && { types },
    ...prefix && { prefix },
    ...productFilters && { productFilters },
    ...unavailableProducts && { unavailableProducts },
  };

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query StorefrontSearch (
            ${ queryTypeDeclaration }
          ) {
            search(
              ${ queryVariableDeclaration }
            ) {
              totalCount
              productFilters {
                id
                label
                type
                values {
                  id
                  label
                  count
                }
              }
              edges {
                node {
                  ${ attrs }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `,
        variables,
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.search',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontSearch,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontSearch" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "query": "dress",
    "options": {
      "first": 5,
      "types": ["PRODUCT"]
    }
  }'
*/
