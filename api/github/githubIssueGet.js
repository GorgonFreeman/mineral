// https://docs.github.com/en/rest/issues/issues#get-an-issue

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
  ['issueNumber'],
]);

const githubIssueGet = async (
  credsPayload,
  owner,
  repo,
  issueNumber,
  {
    params,
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    owner,
    repo,
    issueNumber,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return githubClient.fetch({
    requestPayload: {
      url: `/repos/${ owner }/${ repo }/issues/${ issueNumber }`,
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
  githubIssueGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubIssueGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "GorgonFreeman",
    "repo": "mineral",
    "issueNumber": 1
  }'
*/
