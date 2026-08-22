const DEFAULT_INCLUDE = ['products', 'total_count'];

// "Pagination is restricted to the top 10,000 products."
const MAX_PAGINATION_PRODUCTS = 10000;

// "up to 3 are supported" (recommendations :product_ids param)
const MAX_RECOMMENDATION_PRODUCT_IDS = 3;

// "Returns at most 10 queries" (GET /v2/popular_searches)
const MAX_POPULAR_SEARCHES = 10;

module.exports = {
  DEFAULT_INCLUDE,
  MAX_PAGINATION_PRODUCTS,
  MAX_RECOMMENDATION_PRODUCT_IDS,
  MAX_POPULAR_SEARCHES,
};
