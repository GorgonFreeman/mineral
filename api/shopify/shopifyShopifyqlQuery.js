// https://shopify.dev/docs/api/admin-graphql/latest/queries/shopifyqlQuery
// Requires API version 2025-10+ and the read_reports access scope.

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyClient } = require('./shopify.utils');

const defaultAttrs = `
  tableData {
    columns {
      name
      dataType
      displayName
    }
    rows
  }
  parseErrors
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
]);

const shopifyShopifyqlQuery = async (
  credsPayload,
  query,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await shopifyClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query Shopifyql($query: String!) {
            shopifyqlQuery(query: $query) {
              ${ attrs }
            }
          }
        `,
        variables: {
          query,
        },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.shopifyqlQuery',
    },
  });

  if (!response?.ok) {
    return response;
  }

  const parseErrors = response?.data?.parseErrors;
  if (Array.isArray(parseErrors) && parseErrors.length) {
    return {
      ok: false,
      error: {
        code: 'PARSE_ERROR',
        message: parseErrors.join('; '),
        details: parseErrors,
      },
      data: response.data,
    };
  }

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyShopifyqlQuery,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/shopifyShopifyqlQuery" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "shopify.au" },
      "query": "FROM sales SHOW total_sales, orders TIMESERIES day SINCE -7d ORDER BY day ASC"
    }'

  Example command to get at last restock date
  curl -X POST "http://localhost:8000/shopifyShopifyqlQuery" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "shopify.au" },
      "query": "FROM inventory_adjustment_history SHOW inventory_adjustment_change, product_variant_title, product_variant_sku, day GROUP BY product_variant_title, product_variant_sku, day HAVING inventory_adjustment_change > 10 ORDER BY day DESC LIMIT 10"
    }'
*/
