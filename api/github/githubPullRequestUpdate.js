// https://docs.github.com/en/rest/pulls/pulls#update-a-pull-request

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
  ['pullNumber'],
  ['updatePayload', Boolean],
]);

const githubPullRequestUpdate = async (
  credsPayload,
  owner,
  repo,
  pullNumber,
  updatePayload,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    owner,
    repo,
    pullNumber,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return githubClient.fetch({
    requestPayload: {
      method: 'patch',
      url: `/repos/${ owner }/${ repo }/pulls/${ pullNumber }`,
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
  githubPullRequestUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubPullRequestUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "GorgonFreeman",
    "repo": "mineral",
    "pullNumber": 1,
    "updatePayload": {
      "title": "Updated title",
      "state": "open"
    }
  }'
*/
