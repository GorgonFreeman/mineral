// https://docs.github.com/en/rest/pulls/pulls#list-pull-requests

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubGet } = require('../github/githubGet');
const { MAX_PER_PAGE } = require('../github/github.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
]);

const githubPullRequestsGet = async (
  credsPayload,
  owner,
  repo,
  {
    state,
    head,
    base,
    sort,
    direction,
    perPage,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    owner,
    repo,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const params = {
    ...state && { state },
    ...head && { head },
    ...base && { base },
    ...sort && { sort },
    ...direction && { direction },
  };

  return githubGet(credsPayload, `/repos/${ owner }/${ repo }/pulls`, {
    params,
    perPage: perPage ?? MAX_PER_PAGE,
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  githubPullRequestsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubPullRequestsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "GorgonFreeman",
    "repo": "mineral",
    "options": {
      "state": "open",
      "limit": 10
    }
  }'
*/
