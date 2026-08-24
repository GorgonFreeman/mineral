const DEFAULT_API_VERSION = '62.0';
const DEFAULT_LOGIN_URL = 'https://login.salesforce.com';

// Query result page size is controlled by SOQL; next page uses nextRecordsUrl.
// SObject list endpoints typically allow up to 2000 in some contexts; REST query
// uses the default batch size (often 2000 max via headers / tooling).
const MAX_PER_PAGE = 2000;

module.exports = {
  DEFAULT_API_VERSION,
  DEFAULT_LOGIN_URL,
  MAX_PER_PAGE,
};
