// https://shopify.dev/docs/api/storefront/latest/queries/predictiveSearch

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
  products {
    id
    handle
    title
  }
  collections {
    id
    handle
    title
  }
  pages {
    id
    handle
    title
  }
  articles {
    id
    handle
    title
  }
  queries {
    text
    styledText
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
]);

const shopifyStorefrontPredictiveSearch = async (
  credsPayload,
  query,
  {
    apiVersion,
    attrs = defaultAttrs,
    limit,
    limitScope,
    types,
    searchableFields,
    unavailableProducts,
    inContext,
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

  const inContextDirective = buildInContextDirective(inContext);

  const queryTypeDeclaration = [
    '$query: String!',
    ...limit !== undefined ? ['$limit: Int'] : [],
    ...limitScope ? ['$limitScope: PredictiveSearchLimitScope'] : [],
    ...types ? ['$types: [PredictiveSearchType!]'] : [],
    ...searchableFields ? ['$searchableFields: [SearchableField!]'] : [],
    ...unavailableProducts ? ['$unavailableProducts: SearchUnavailableProductsType'] : [],
  ].join('\n');

  const queryVariableDeclaration = [
    'query: $query',
    ...limit !== undefined ? ['limit: $limit'] : [],
    ...limitScope ? ['limitScope: $limitScope'] : [],
    ...types ? ['types: $types'] : [],
    ...searchableFields ? ['searchableFields: $searchableFields'] : [],
    ...unavailableProducts ? ['unavailableProducts: $unavailableProducts'] : [],
  ].join('\n');

  const variables = {
    query,
    ...limit !== undefined && { limit },
    ...limitScope && { limitScope },
    ...types && { types },
    ...searchableFields && { searchableFields },
    ...unavailableProducts && { unavailableProducts },
  };

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query StorefrontPredictiveSearch (
            ${ queryTypeDeclaration }
          )${ inContextDirective } {
            predictiveSearch(
              ${ queryVariableDeclaration }
            ) {
              ${ attrs }
            }
          }
        `,
        variables,
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.predictiveSearch',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontPredictiveSearch,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontPredictiveSearch" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "query": "dress",
    "options": { "limit": 5, "types": ["PRODUCT"] }
  }'
*/
