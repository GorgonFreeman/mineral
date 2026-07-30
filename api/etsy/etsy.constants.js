const BASE_URL = 'https://api.etsy.com/v3';
const OAUTH_CONNECT_URL = 'https://www.etsy.com/oauth/connect';
const MAX_PER_PAGE = 100;

const OAUTH_ALL_SCOPES = [
  'address_r', 
  'address_w', 
  'billing_r', 
  'cart_r', 
  'cart_w', 
  'email_r', 
  'favorites_r', 
  'favorites_w', 
  'feedback_r', 
  'listings_d', 
  'listings_r', 
  'listings_w', 
  'profile_r', 
  'profile_w', 
  'recommend_r', 
  'recommend_w', 
  'shops_r', 
  'shops_w', 
  'transactions_r', 
  'transactions_w',
];

module.exports = {
  BASE_URL,
  OAUTH_CONNECT_URL,
  MAX_PER_PAGE,
  OAUTH_ALL_SCOPES,
};
