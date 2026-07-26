// https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
  ['pullNumber'],
]);

const githubPullRequestGet = async (
  credsPayload,
  owner,
  repo,
  pullNumber,
  {
    params,
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    owner,
    repo,
    pullNumber,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return githubClient.fetch({
    requestPayload: {
      url: `/repos/${ owner }/${ repo }/pulls/${ pullNumber }`,
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
  githubPullRequestGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubPullRequestGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "GorgonFreeman",
    "repo": "mineral",
    "pullNumber": 1
  }'
*/
