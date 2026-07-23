// TODO: Split out API version
const BASE_URL = 'https://apis.bleckmann.com/warehousing/v1.6.0';
const MAX_PER_PAGE = 1000; // The 'limit' query parameter must be an integer from 1 to 1000

module.exports = {
  BASE_URL,
  MAX_PER_PAGE,
};
