const { objHasAny } = require('./utils');

const credsValidator = (creds) => {
  if (!objHasAny(creds, ['credsPath', 'credsObject', 'credsProvider'])) {
    return false; // TODO: Consider returning [false, message]
  }
  return true;
};

module.exports = {
  credsValidator,
};