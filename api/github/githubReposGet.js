// https://docs.github.com/en/rest/repos/repos#list-repositories-for-the-authenticated-user

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubGet } = require('../github/githubGet');
const { MAX_PER_PAGE } = require('../github/github.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const githubReposGet = async (
  credsPayload,
  {
    org,
    type,
    sort,
    direction,
    perPage,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const url = org ? `/orgs/${ org }/repos` : '/user/repos';

  const params = {
    ...type && { type },
    ...sort && { sort },
    ...direction && { direction },
  };

  return githubGet(credsPayload, url, {
    params,
    perPage: perPage ?? MAX_PER_PAGE,
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  githubReposGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubReposGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" }
  }'

curl -X POST "http://localhost:8000/githubReposGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "options": {
      "org": "GorgonFreeman",
      "limit": 10
    }
  }'
*/
