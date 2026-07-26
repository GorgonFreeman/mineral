// https://docs.github.com/en/rest/repos/repos#get-a-repository

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
]);

const githubRepoGet = async (
  credsPayload,
  owner,
  repo,
  {
    params,
    apiVersion,
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

  return githubClient.fetch({
    requestPayload: {
      url: `/repos/${ owner }/${ repo }`,
      params,
    },
    context: {
      credsPayload,
      apiVersion,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  githubRepoGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubRepoGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "GorgonFreeman",
    "repo": "mineral"
  }'
*/
