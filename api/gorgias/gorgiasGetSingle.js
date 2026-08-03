const { gorgiasClient } = require('../gorgias/gorgias.utils');

const gorgiasGetSingle = async (
  credsPayload,
  collectionPath,
  id,
  {
    inspect = false,
    fetchClient = gorgiasClient,
  } = {},
) => {
  const normalizedPath = collectionPath.replace(/\/$/, '');

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `${ normalizedPath }/${ id }`,
    },
    context: { credsPayload },
    inspect,
  });
};

module.exports = {
  gorgiasGetSingle,
};
