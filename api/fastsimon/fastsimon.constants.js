const BASE_URL = 'https://api.fastsimon.com';

// Common sort_by values documented on full_text_search
const SORT_BY_OPTIONS = [
  'relevency', // spelling as returned by the API docs
  'price_min_to_max',
  'price_max_to_min',
  'creation_date',
  'creation_date_oldest',
  'reviews',
  'a_to_z',
  'z_to_a',
];

module.exports = {
  BASE_URL,
  SORT_BY_OPTIONS,
};
