// https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
  ['pullNumber'],
]);

const githubPullRequestMerge = async (
  credsPayload,
  owner,
  repo,
  pullNumber,
  {
    commitTitle,
    commitMessage,
    sha,
    mergeMethod,
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
      method: 'put',
      url: `/repos/${ owner }/${ repo }/pulls/${ pullNumber }/merge`,
      body: {
        ...commitTitle && { commit_title: commitTitle },
        ...commitMessage && { commit_message: commitMessage },
        ...sha && { sha },
        ...mergeMethod && { merge_method: mergeMethod },
      },
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
  githubPullRequestMerge,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubPullRequestMerge" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "GorgonFreeman",
    "repo": "mineral",
    "pullNumber": 1,
    "options": {
      "mergeMethod": "squash"
    }
  }'
*/
