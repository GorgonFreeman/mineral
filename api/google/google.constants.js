const GOOGLE_SCOPES = {
  sheets: ['https://www.googleapis.com/auth/spreadsheets'],
  drive: ['https://www.googleapis.com/auth/drive'],
  calendar: ['https://www.googleapis.com/auth/calendar'],
  analytics: ['https://www.googleapis.com/auth/analytics'],
  gmailSettings: ['https://www.googleapis.com/auth/gmail.settings.basic'],
};

const MAX_PER_PAGE = 1000;

module.exports = {
  GOOGLE_SCOPES,
  MAX_PER_PAGE,
};
