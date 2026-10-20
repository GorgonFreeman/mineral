// https://developers.google.com/gmail/api/reference/rest/v1/users.settings/updateVacation

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getGmail, googleApiCall } = require('../google/google.utils');

const vacationSettingsValidator = (vacationSettings) => {
  return typeof vacationSettings?.enableAutoReply === 'boolean';
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['subject'],
  ['vacationSettings', vacationSettingsValidator],
]);

const gmailVacationSettingsUpdate = async (
  credsPayload,
  subject,
  vacationSettings,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    subject,
    vacationSettings,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { client, error } = await getGmail(credsPayload, { subject });

  if (error) {
    return error;
  }

  return googleApiCall(() => client.users.settings.updateVacation({
    userId: 'me',
    requestBody: vacationSettings,
  }));
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  gmailVacationSettingsUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gmailVacationSettingsUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "subject": "john@whitefoxboutique.com",
    "vacationSettings": {
      "enableAutoReply": true,
      "responseBodyPlainText": "Away until Nov 19.",
      "startTime": 1760716800000,
      "endTime": 1763568000000
    }
  }'
*/
