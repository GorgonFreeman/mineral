// https://docs.github.com/en/rest/users/users#get-the-authenticated-user
// https://docs.github.com/en/rest/users/users#get-a-user

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const githubUserGet = async (
  credsPayload,
  {
    username,
    params,
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const url = username ? `/users/${ username }` : '/user';

  return githubClient.fetch({
    requestPayload: {
      url,
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
  githubUserGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubUserGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" }
  }'

curl -X POST "http://localhost:8000/githubUserGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "options": {
      "username": "GorgonFreeman"
    }
  }'
*/
