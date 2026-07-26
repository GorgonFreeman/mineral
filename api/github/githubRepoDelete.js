// https://docs.github.com/en/rest/repos/repos#delete-a-repository

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
]);

const githubRepoDelete = async (
  credsPayload,
  owner,
  repo,
  {
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
      method: 'delete',
      url: `/repos/${ owner }/${ repo }`,
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
  githubRepoDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubRepoDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "GorgonFreeman",
    "repo": "my-old-repo"
  }'
*/
