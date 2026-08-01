const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleCalendar, googleApiCall } = require('../google/google.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const googlecalendarCalendarsGet = async (
  credsPayload,
  {
    subject,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { client, error } = await getGoogleCalendar(credsPayload, { subject });

  if (error) {
    return error;
  }

  return googleApiCall(() => client.calendarList.list());
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googlecalendarCalendarsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googlecalendarCalendarsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" }
  }'
*/
