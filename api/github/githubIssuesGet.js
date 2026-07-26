// https://docs.github.com/en/rest/issues/issues#list-repository-issues

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubGet } = require('../github/githubGet');
const { MAX_PER_PAGE } = require('../github/github.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
]);

const githubIssuesGet = async (
  credsPayload,
  owner,
  repo,
  {
    state,
    labels,
    sort,
    direction,
    since,
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
    ...labels && { labels },
    ...sort && { sort },
    ...direction && { direction },
    ...since && { since },
  };

  return githubGet(credsPayload, `/repos/${ owner }/${ repo }/issues`, {
    params,
    perPage: perPage ?? MAX_PER_PAGE,
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  githubIssuesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubIssuesGet" \
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
