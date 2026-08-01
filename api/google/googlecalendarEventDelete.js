const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleCalendar, googleApiCall } = require('../google/google.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['eventId'],
]);

const googlecalendarEventDelete = async (
  credsPayload,
  eventId,
  {
    subject,
    calendarId = 'primary',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    eventId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { client, error } = await getGoogleCalendar(credsPayload, { subject });

  if (error) {
    return error;
  }

  return googleApiCall(() => client.events.delete({
    calendarId,
    eventId,
  }));
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googlecalendarEventDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googlecalendarEventDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "eventId": "abc123"
  }'
*/
