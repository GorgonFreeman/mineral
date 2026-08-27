const { google } = require('googleapis');
const { credsFromPayload } = require('../utils');
const { GOOGLE_SCOPES } = require('../google/google.constants');

const invalidCredsResponse = () => ({
  ok: false,
  error: {
    code: 'INVALID_CREDS',
    message: 'SERVICE_ACCOUNT_JSON is required on google creds.',
  },
});

const resolveServiceAccountJson = async (credsPayload) => {
  const creds = await credsFromPayload(credsPayload);

  if (!creds?.SERVICE_ACCOUNT_JSON) {
    return null;
  }

  return creds.SERVICE_ACCOUNT_JSON;
};

const buildGoogleAuth = (
  serviceAccountJson,
  {
    scopes,
    subject,
  },
) => {
  if (subject) {
    return new google.auth.JWT({
      email: serviceAccountJson.client_email,
      key: serviceAccountJson.private_key,
      scopes,
      subject,
    });
  }

  return new google.auth.GoogleAuth({
    credentials: serviceAccountJson,
    scopes,
  });
};

const getGoogleAuth = async (
  credsPayload,
  {
    scopes,
    subject,
  },
) => {
  const serviceAccountJson = await resolveServiceAccountJson(credsPayload);

  if (!serviceAccountJson) {
    return { error: invalidCredsResponse() };
  }

  return {
    auth: buildGoogleAuth(serviceAccountJson, { scopes, subject }),
  };
};

const getGoogleSheets = async (credsPayload) => {
  const { auth, error } = await getGoogleAuth(credsPayload, {
    scopes: GOOGLE_SCOPES.sheets,
  });

  if (error) {
    return { error };
  }

  return {
    client: google.sheets({ version: 'v4', auth }),
  };
};

const getGoogleDrive = async (credsPayload) => {
  const { auth, error } = await getGoogleAuth(credsPayload, {
    scopes: GOOGLE_SCOPES.drive,
  });

  if (error) {
    return { error };
  }

  return {
    client: google.drive({ version: 'v3', auth }),
  };
};

const getGoogleCalendar = async (
  credsPayload,
  {
    subject,
  } = {},
) => {
  const { auth, error } = await getGoogleAuth(credsPayload, {
    scopes: GOOGLE_SCOPES.calendar,
    subject,
  });

  if (error) {
    return { error };
  }

  return {
    client: google.calendar({ version: 'v3', auth }),
  };
};

const getGoogleAnalyticsData = async (
  credsPayload,
  {
    subject,
  } = {},
) => {
  const { auth, error } = await getGoogleAuth(credsPayload, {
    scopes: GOOGLE_SCOPES.analytics,
    subject,
  });

  if (error) {
    return { error };
  }

  return {
    client: google.analyticsdata({ version: 'v1beta', auth }),
  };
};

const googleApiCall = async (promiseFn) => {
  try {
    const response = await promiseFn();
    return {
      ok: true,
      data: response?.data ?? response,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GOOGLE_API_ERROR',
        message: error.message,
        details: error.response?.data ?? error.errors ?? error,
      },
    };
  }
};

module.exports = {
  resolveServiceAccountJson,
  getGoogleSheets,
  getGoogleDrive,
  getGoogleCalendar,
  getGoogleAnalyticsData,
  googleApiCall,
  invalidCredsResponse,
};
