const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleCalendar, googleApiCall } = require('../google/google.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const googlecalendarEventsGet = async (
  credsPayload,
  {
    subject,
    calendarId = 'primary',
    timeMin,
    timeMax,
    maxResults = 50,
    orderBy = 'startTime',
    singleEvents = true,
    q,
    pageToken,
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

  return googleApiCall(() => client.events.list({
    calendarId,
    ...timeMin && { timeMin },
    ...timeMax && { timeMax },
    maxResults,
    orderBy,
    singleEvents,
    ...q && { q },
    ...pageToken && { pageToken },
  }));
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googlecalendarEventsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googlecalendarEventsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "options": { "calendarId": "primary", "maxResults": 10 }
  }'
*/
