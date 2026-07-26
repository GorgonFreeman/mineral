// https://docs.github.com/en/rest/repos/repos#update-a-repository

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
  ['updatePayload', Boolean],
]);

const githubRepoUpdate = async (
  credsPayload,
  owner,
  repo,
  updatePayload,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    owner,
    repo,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return githubClient.fetch({
    requestPayload: {
      method: 'patch',
      url: `/repos/${ owner }/${ repo }`,
      body: updatePayload,
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
  githubRepoUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubRepoUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "GorgonFreeman",
    "repo": "mineral",
    "updatePayload": {
      "description": "Updated description",
      "private": true
    }
  }'
*/
