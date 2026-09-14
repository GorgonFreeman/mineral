// https://docs.github.com/en/rest/actions/secrets#create-or-update-a-repository-secret
// https://docs.github.com/en/rest/actions/secrets#get-a-repository-public-key

const sodium = require('libsodium-wrappers');
const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { githubClient } = require('../github/github.utils');
const { githubActionsSecretPublicKeyGet } = require('../github/githubActionsSecretPublicKeyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['owner'],
  ['repo'],
  ['secretName'],
  ['secretValue'],
]);

const encryptSecretValue = async (secretValue, publicKey) => {
  await sodium.ready;

  const binaryKey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
  const binarySecret = sodium.from_string(String(secretValue));
  const encryptedBytes = sodium.crypto_box_seal(binarySecret, binaryKey);

  return sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);
};

const githubActionsSecretCreateOrUpdate = async (
  credsPayload,
  owner,
  repo,
  secretName,
  secretValue,
  {
    apiVersion,
    keyId,
    publicKey,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    owner,
    repo,
    secretName,
    secretValue,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  let resolvedKeyId = keyId;
  let resolvedPublicKey = publicKey;

  if (!resolvedKeyId || !resolvedPublicKey) {
    const publicKeyResponse = await githubActionsSecretPublicKeyGet(
      credsPayload,
      owner,
      repo,
      { apiVersion },
    );

    if (!publicKeyResponse?.ok) {
      return publicKeyResponse;
    }

    resolvedKeyId = publicKeyResponse.data.key_id;
    resolvedPublicKey = publicKeyResponse.data.key;
  }

  const encryptedValue = await encryptSecretValue(secretValue, resolvedPublicKey);

  const response = await githubClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/repos/${ owner }/${ repo }/actions/secrets/${ encodeURIComponent(secretName) }`,
      body: {
        encrypted_value: encryptedValue,
        key_id: resolvedKeyId,
      },
      responseParser: async (res) => {
        const text = await res.text();
        if (!text) {
          return {
            secretName,
            status: res.status,
          };
        }
        try {
          return JSON.parse(text);
        } catch {
          return {
            secretName,
            status: res.status,
            body: text,
          };
        }
      },
    },
    context: {
      credsPayload,
      apiVersion,
    },
  });

  if (!response?.ok) {
    return response;
  }

  return {
    ok: true,
    data: {
      secretName,
      ...(response.data || {}),
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  githubActionsSecretCreateOrUpdate,
  encryptSecretValue,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/githubActionsSecretCreateOrUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "github" },
    "owner": "whitefoxboutique",
    "repo": "whitefox-shopify-theme",
    "secretName": "REGIONS",
    "secretValue": "au,us,uk"
  }'
*/
