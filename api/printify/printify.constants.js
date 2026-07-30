const BASE_URL = 'https://api.printify.com/v1';
// Printify list endpoints reject limit > 50 (API error 8150).
const MAX_PER_PAGE = 50;

module.exports = {
  BASE_URL,
  MAX_PER_PAGE,
};
