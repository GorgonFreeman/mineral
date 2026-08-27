const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE_URL = 'https://accounts.spotify.com';
// Most list endpoints cap at 50; search max is lower (10 as of 2026 policy changes).
const MAX_PER_PAGE = 50;
const MAX_SEARCH_PER_PAGE = 10;

module.exports = {
  SPOTIFY_API_BASE_URL,
  SPOTIFY_ACCOUNTS_BASE_URL,
  MAX_PER_PAGE,
  MAX_SEARCH_PER_PAGE,
};
