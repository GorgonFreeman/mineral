// https://docs.github.com/en/rest/pulls/pulls#create-a-pull-request

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const pullRequestPayloadValidator = (pullRequestPayload) => {
  return Boolean(pullRequestPayload?.head) && Boolean(pullRequestPayload?.base);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
  ['pullRequestPayload', pullRequestPayloadValidator],
]);

const githubPullRequestCreate = async (
  credsPayload,
  owner,
  repo,
  pullRequestPayload,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    owner,
    repo,
    pullRequestPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return githubClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/repos/${ owner }/${ repo }/pulls`,
      body: pullRequestPayload,
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
  githubPullRequestCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubPullRequestCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "GorgonFreeman",
    "repo": "mineral",
    "pullRequestPayload": {
      "title": "Amazing new feature",
      "head": "feature-branch",
      "base": "main",
      "body": "Please review"
    }
  }'
*/
