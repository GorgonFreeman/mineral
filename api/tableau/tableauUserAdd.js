// https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#add_user_to_site

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { tableauClient } = require('../tableau/tableau.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['username'],
  ['siteRole'],
]);

// siteRole is the "whatever permissions" lever -> any valid Tableau site
// role: Creator, Explorer, ExplorerCanPublish, Viewer, SiteAdministratorCreator,
// SiteAdministratorExplorer, Unlicensed, etc.
const tableauUserAdd = async (
  credsPayload,
  username,
  siteRole = 'Viewer',
  {
    authSetting, // optional: 'ServerDefault' | 'SAML' | 'OpenID' | 'TableauIDWithMFA' ...
    fetchClient = tableauClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    username,
    siteRole,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    context: {
      credsPayload,
    },
    requestPayload: {
      url: '/sites/{siteId}/users',
      method: 'post',
      body: {
        user: {
          name: username,
          siteRole,
          ...(authSetting ? { authSetting } : {}),
        },
      },
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return {
    ok: true,
    data: data.user ?? data,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  tableauUserAdd,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/tableauUserAdd" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "tableau" },
    "username": "dora@example.com",
    "siteRole": "Explorer"
  }'
*/
