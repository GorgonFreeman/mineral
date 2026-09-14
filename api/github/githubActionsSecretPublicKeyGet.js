// https://docs.github.com/en/rest/actions/secrets#get-a-repository-public-key

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
]);

const githubActionsSecretPublicKeyGet = async (
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
      url: `/repos/${ owner }/${ repo }/actions/secrets/public-key`,
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
  githubActionsSecretPublicKeyGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubActionsSecretPublicKeyGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "whitefoxboutique",
    "repo": "whitefox-shopify-theme"
  }'
*/
