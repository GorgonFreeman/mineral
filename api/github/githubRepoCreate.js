// https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user
// https://docs.github.com/en/rest/repos/repos#create-an-organization-repository

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const repoPayloadValidator = (repoPayload) => Boolean(repoPayload?.name);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['repoPayload', repoPayloadValidator],
]);

const githubRepoCreate = async (
  credsPayload,
  repoPayload,
  {
    org,
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    repoPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const url = org ? `/orgs/${ org }/repos` : '/user/repos';

  return githubClient.fetch({
    requestPayload: {
      method: 'post',
      url,
      body: repoPayload,
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
  githubRepoCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubRepoCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "repoPayload": {
      "name": "my-new-repo",
      "private": true,
      "auto_init": true
    }
  }'

curl -X POST "http://localhost:8000/githubRepoCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "repoPayload": {
      "name": "my-org-repo",
      "private": false
    },
    "options": {
      "org": "GorgonFreeman"
    }
  }'
*/
