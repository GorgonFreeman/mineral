// https://linear.app/developers/graphql

const { ArgsWarden, actionSingleOrMultiple, everyIfArray, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const invitePayloadValidator = (invitePayload) => {
  return valueProvided(invitePayload?.email);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['invitePayload', (invitePayload) => everyIfArray(invitePayloadValidator, invitePayload)],
]);

const linearOrganizationInviteCreateSingle = async (
  credsPayload,
  invitePayload,
  {
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {
  const {
    email,
    role = 'user',
    teamIds,
  } = invitePayload;

  return fetchClient.fetch({
    requestPayload: {
      body: {
        query: `
          mutation OrganizationInviteCreate($input: OrganizationInviteCreateInput!) {
            organizationInviteCreate(input: $input) {
              success
              organizationInvite {
                id
                email
                role
                createdAt
                expiresAt
                acceptedAt
              }
            }
          }
        `,
        variables: {
          input: {
            email,
            role,
            ...teamIds && { teamIds },
          },
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.organizationInviteCreate',
    },
    inspect,
  });
};

const linearOrganizationInviteCreate = async (
  credsPayload,
  invitePayload,
  {
    inspect = false,
    fetchClient = linearClient,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    invitePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    invitePayload,
    linearOrganizationInviteCreateSingle,
    (invitePayloadItem) => ({
      args: [credsPayload, invitePayloadItem, { inspect, fetchClient }],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearOrganizationInviteCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearOrganizationInviteCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "invitePayload": [
      { "email": "someone@whitefoxboutique.com" },
      { "email": "someoneelse@whitefoxboutique.com" }
    ]
  }'
*/
