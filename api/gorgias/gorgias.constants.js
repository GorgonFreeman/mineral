const apiBaseUrlForDomain = (domain) => `https://${ domain }.gorgias.com/api`;

const MAX_PER_PAGE = 100;

module.exports = {
  apiBaseUrlForDomain,
  MAX_PER_PAGE,
};
