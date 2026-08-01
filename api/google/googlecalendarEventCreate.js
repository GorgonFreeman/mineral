const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleCalendar, googleApiCall } = require('../google/google.utils');

const eventDataValidator = (eventData) => {
  return Boolean(eventData?.summary && eventData?.start && eventData?.end);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['eventData', eventDataValidator],
]);

const googlecalendarEventCreate = async (
  credsPayload,
  eventData,
  {
    subject,
    calendarId = 'primary',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    eventData,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { client, error } = await getGoogleCalendar(credsPayload, { subject });

  if (error) {
    return error;
  }

  return googleApiCall(() => client.events.insert({
    calendarId,
    requestBody: eventData,
  }));
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googlecalendarEventCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googlecalendarEventCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "eventData": {
      "summary": "Meeting",
      "start": { "dateTime": "2026-04-09T10:00:00-04:00" },
      "end": { "dateTime": "2026-04-09T11:00:00-04:00" }
    }
  }'
*/
