// https://docs.github.com/en/rest/issues/issues#update-an-issue

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
  ['issueNumber'],
  ['updatePayload', Boolean],
]);

const githubIssueUpdate = async (
  credsPayload,
  owner,
  repo,
  issueNumber,
  updatePayload,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    owner,
    repo,
    issueNumber,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return githubClient.fetch({
    requestPayload: {
      method: 'patch',
      url: `/repos/${ owner }/${ repo }/issues/${ issueNumber }`,
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
  githubIssueUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubIssueUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "GorgonFreeman",
    "repo": "mineral",
    "issueNumber": 1,
    "updatePayload": {
      "state": "closed"
    }
  }'
*/
