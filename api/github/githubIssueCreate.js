// https://docs.github.com/en/rest/issues/issues#create-an-issue

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const issuePayloadValidator = (issuePayload) => Boolean(issuePayload?.title);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
  ['issuePayload', issuePayloadValidator],
]);

const githubIssueCreate = async (
  credsPayload,
  owner,
  repo,
  issuePayload,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    owner,
    repo,
    issuePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return githubClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/repos/${ owner }/${ repo }/issues`,
      body: issuePayload,
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
  githubIssueCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubIssueCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "GorgonFreeman",
    "repo": "mineral",
    "issuePayload": {
      "title": "Found a bug",
      "body": "Details here",
      "labels": ["bug"]
    }
  }'
*/
